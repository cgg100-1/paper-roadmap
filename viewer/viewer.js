const fileInput = document.getElementById('fileInput');
const openButton = document.getElementById('openWorkbook');
const reloadButton = document.getElementById('reloadWorkbook');
const welcome = document.getElementById('welcome');
const errorBox = document.getElementById('errorBox');
const roadmap = document.getElementById('roadmap');
const planner = document.getElementById('planner');
const workbookName = document.getElementById('workbookName');
const itemCount = document.getElementById('itemCount');

const palette = [
  ['#B8D4B8','#1A3A1A'],['#E8A8B4','#5A1C26'],['#A8BEE0','#182A52'],['#E8B090','#5A260E'],
  ['#C4B2E0','#2A1A52'],['#8CCCC0','#0A2E26'],['#F0C898','#5A360E'],['#B8C0E8','#181E4E'],
  ['#C8CE8A','#282E0E'],['#D4A8BC','#481636']
];
const monthBands = ['#EAE6F5','#F5E6EB','#E6F2EB','#F5EDE3','#E3EDF5','#F5F2DC','#F5E3ED','#E3F0E8','#E6EAF5','#F5E9DC','#DCF0F5','#F2EDD8'];
const milestoneColours = { deadline:'#CC5555', launch:'#5A9E6A', review:'#8A5EBE', release:'#B87820' };
const DAY_WIDTH = 5;
const LABEL_WIDTH = 220;
const ROW_HEIGHTS = [78,54,38,30];
const BAR_HEIGHTS = [34,24,14,8];
let collapsed = new Set();
let lastWorkbookName = '';
let currentModel = null;

openButton.addEventListener('click', () => fileInput.click());
reloadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    setError('');
    const workbook = await readXlsx(file);
    const model = workbookToModel(workbook);
    currentModel = model;
    lastWorkbookName = file.name;
    render(model);
    welcome.hidden = true;
    roadmap.hidden = false;
    reloadButton.disabled = false;
    workbookName.textContent = file.name;
    itemCount.textContent = `${model.items.length} item${model.items.length === 1 ? '' : 's'}`;
  } catch (error) {
    setError(error instanceof Error ? error.message : String(error));
  } finally {
    fileInput.value = '';
  }
});

function setError(message) {
  errorBox.hidden = !message;
  errorBox.textContent = message;
}

async function readXlsx(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = await unzip(bytes);
  const getText = name => {
    const value = entries.get(name);
    if (!value) return null;
    return new TextDecoder().decode(value);
  };

  const workbookXml = getText('xl/workbook.xml');
  const workbookRelsXml = getText('xl/_rels/workbook.xml.rels');
  if (!workbookXml || !workbookRelsXml) throw new Error('This does not look like a valid .xlsx workbook.');

  const sharedStrings = parseSharedStrings(getText('xl/sharedStrings.xml'));
  const workbookDoc = xml(workbookXml);
  const relsDoc = xml(workbookRelsXml);
  const relTargets = new Map([...relsDoc.querySelectorAll('Relationship')].map(rel => [rel.getAttribute('Id'), rel.getAttribute('Target')]));
  const sheets = {};

  for (const sheet of workbookDoc.querySelectorAll('sheet')) {
    const name = sheet.getAttribute('name') || 'Sheet';
    const relId = sheet.getAttribute('r:id') || sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
    const target = relTargets.get(relId);
    if (!target) continue;
    const path = normaliseWorkbookTarget(target);
    const sheetText = getText(path);
    if (!sheetText) continue;
    sheets[name] = parseSheet(sheetText, sharedStrings);
  }
  return sheets;
}

function xml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const error = doc.querySelector('parsererror');
  if (error) throw new Error('Could not read workbook XML.');
  return doc;
}

function normaliseWorkbookTarget(target) {
  const clean = target.replace(/^\//,'').replace(/^xl\//,'');
  return `xl/${clean}`.replace(/\/\.\//g,'/');
}

function parseSharedStrings(text) {
  if (!text) return [];
  const doc = xml(text);
  return [...doc.querySelectorAll('si')].map(si => [...si.querySelectorAll('t')].map(t => t.textContent || '').join(''));
}

function parseSheet(text, sharedStrings) {
  const doc = xml(text);
  const rows = [];
  for (const row of doc.querySelectorAll('sheetData > row')) {
    const values = [];
    for (const cell of row.querySelectorAll('c')) {
      const ref = cell.getAttribute('r') || 'A1';
      const col = columnIndex(ref.replace(/[0-9]/g,''));
      const type = cell.getAttribute('t');
      const v = cell.querySelector('v')?.textContent ?? '';
      let value = v;
      if (type === 's') value = sharedStrings[Number(v)] ?? '';
      else if (type === 'inlineStr') value = [...cell.querySelectorAll('is t')].map(t => t.textContent || '').join('');
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
      values[col] = value;
    }
    rows.push(values.map(v => v ?? ''));
  }
  return rows;
}

function columnIndex(letters) {
  let result = 0;
  for (const ch of letters.toUpperCase()) result = result * 26 + ch.charCodeAt(0) - 64;
  return Math.max(0, result - 1);
}

async function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Could not read the Excel ZIP container.');
  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries = new Map();
  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('Workbook ZIP directory is invalid.');
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    entries.set(name, method === 0 ? compressed : await inflateRaw(compressed, method));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(bytes, method) {
  if (method !== 8) throw new Error(`Unsupported Excel compression method: ${method}`);
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot unpack .xlsx files. Please use a current Chrome or Edge browser.');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function workbookToModel(workbook) {
  const itemsRows = findSheet(workbook, ['Items','Roadmap','Planning Items']);
  if (!itemsRows) throw new Error('Workbook needs an “Items” sheet. See viewer/README.md for the expected columns.');
  const milestonesRows = findSheet(workbook, ['Milestones']);
  const externalRows = findSheet(workbook, ['External Dependencies','ExternalDependencies','External deps']);

  const rawItems = tableToObjects(itemsRows);
  if (!rawItems.length) throw new Error('The Items sheet has no data rows.');

  const items = rawItems.map((row, index) => {
    const [fallbackColour, fallbackText] = palette[index % palette.length];
    const title = pick(row, ['Item','Title','Name']);
    if (!title) throw new Error(`Items row ${index + 2} needs an Item or Title.`);
    return {
      id: pick(row,['ID','Id','id']) || slug(`${title}-${index}`),
      title,
      parent: pick(row,['Parent','Parent Item']),
      startDate: normaliseDate(pick(row,['Start','Start Date','StartDate']), `Items row ${index + 2} Start`),
      endDate: normaliseDate(pick(row,['End','End Date','EndDate']), `Items row ${index + 2} End`),
      team: pick(row,['Team']),
      owner: pick(row,['Owner']),
      status: pick(row,['Status']) || 'planning',
      description: pick(row,['Description','Notes']),
      colour: pick(row,['Colour','Color']) || fallbackColour,
      textColour: pick(row,['Text Colour','Text Color']) || fallbackText,
      row:index,
      milestones:[],
      externalDependencies:[]
    };
  });

  const byTitle = new Map(items.map(item => [item.title.trim().toLowerCase(), item]));
  const byId = new Map(items.map(item => [item.id, item]));
  for (const item of items) {
    const parentKey = item.parent.trim().toLowerCase();
    item.parentId = parentKey ? (byTitle.get(parentKey)?.id || byId.get(item.parent)?.id || null) : null;
  }

  for (const [index,row] of tableToObjects(milestonesRows || []).entries()) {
    const owner = resolveItem(row, byTitle, byId);
    if (!owner) continue;
    owner.milestones.push({
      title: pick(row,['Milestone','Title','Name']) || `Milestone ${index + 1}`,
      date: normaliseDate(pick(row,['Date']), `Milestones row ${index + 2} Date`),
      type: (pick(row,['Type']) || 'deadline').toLowerCase()
    });
  }

  for (const [index,row] of tableToObjects(externalRows || []).entries()) {
    const owner = resolveItem(row, byTitle, byId);
    if (!owner) continue;
    owner.externalDependencies.push({
      title: pick(row,['Dependency','External Dependency','Title','Name']) || `External dependency ${index + 1}`,
      date: normaliseDate(pick(row,['Date']), `External Dependencies row ${index + 2} Date`)
    });
  }

  return { items };
}

function findSheet(workbook, names) {
  const entries = Object.entries(workbook);
  for (const name of names) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === name.toLowerCase());
    if (match) return match[1];
  }
  return null;
}

function tableToObjects(rows) {
  if (!rows?.length) return [];
  const headers = rows[0].map(v => String(v).trim());
  return rows.slice(1).filter(row => row.some(v => String(v).trim() !== '')).map(row => Object.fromEntries(headers.map((header,i) => [header,String(row[i] ?? '').trim()])));
}

function pick(row, names) {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (key && row[key] !== '') return row[key];
  }
  return '';
}

function resolveItem(row, byTitle, byId) {
  const ref = pick(row,['Item','Item ID','Planning Item']);
  return byId.get(ref) || byTitle.get(ref.trim().toLowerCase()) || null;
}

function normaliseDate(value, label) {
  if (!value) throw new Error(`${label} is blank.`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    const serial = Number(value);
    const utc = Date.UTC(1899,11,30) + Math.round(serial) * 86400000;
    return new Date(utc).toISOString().slice(0,10);
  }
  const uk = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (uk) {
    const year = uk[3].length === 2 ? `20${uk[3]}` : uk[3];
    return `${year}-${uk[2].padStart(2,'0')}-${uk[1].padStart(2,'0')}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0,10);
  throw new Error(`${label} is not a recognised date: ${value}`);
}

function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function dayNumber(iso) { return Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000); }
function addDays(iso, days) { return new Date((dayNumber(iso) + days) * 86400000).toISOString().slice(0,10); }
function mondayOnOrBefore(iso) { const d = new Date(`${iso}T00:00:00Z`); const dow = d.getUTCDay(); return addDays(iso, -((dow + 6) % 7)); }
function monthStart(iso) { return `${iso.slice(0,7)}-01`; }
function nextMonth(iso) { const d = new Date(`${iso.slice(0,7)}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth()+1); return d.toISOString().slice(0,10); }
function formatMonth(iso) { return new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`)); }
function formatShort(iso) { return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`)); }

function buildLayout(items) {
  const children = new Map();
  for (const item of items) {
    if (!item.parentId) continue;
    if (!children.has(item.parentId)) children.set(item.parentId,[]);
    children.get(item.parentId).push(item);
  }
  for (const list of children.values()) list.sort((a,b) => a.row-b.row);
  const roots = items.filter(item => !item.parentId || !items.some(p => p.id === item.parentId)).sort((a,b) => a.row-b.row);
  const result = [];
  const visit = (item,depth) => {
    result.push({item,depth,height:ROW_HEIGHTS[Math.min(depth,ROW_HEIGHTS.length-1)],barHeight:BAR_HEIGHTS[Math.min(depth,BAR_HEIGHTS.length-1)]});
    if (collapsed.has(item.id)) return;
    for (const child of children.get(item.id) || []) visit(child,depth+1);
  };
  roots.forEach(root => visit(root,0));
  return {rows:result,children};
}

function render(model) {
  const { items } = model;
  if (!items.length) { planner.innerHTML = '<div class="empty-state">No items to display.</div>'; return; }
  const minDate = items.reduce((min,item) => item.startDate < min ? item.startDate : min, items[0].startDate);
  const maxDate = items.reduce((max,item) => item.endDate > max ? item.endDate : max, items[0].endDate);
  const timelineStart = monthStart(minDate);
  const timelineEnd = nextMonth(monthStart(maxDate));
  const timelineDays = dayNumber(timelineEnd) - dayNumber(timelineStart);
  const timelineWidth = timelineDays * DAY_WIDTH;
  const months = [];
  for (let cursor = timelineStart; cursor < timelineEnd; cursor = nextMonth(cursor)) {
    const end = nextMonth(cursor);
    months.push({start:cursor,end,days:dayNumber(end)-dayNumber(cursor)});
  }
  const weeks = [];
  for (let cursor = mondayOnOrBefore(timelineStart); cursor < timelineEnd; cursor = addDays(cursor,7)) {
    const start = cursor < timelineStart ? timelineStart : cursor;
    const endRaw = addDays(cursor,7);
    const end = endRaw > timelineEnd ? timelineEnd : endRaw;
    if (end > start) weeks.push({start,end,days:dayNumber(end)-dayNumber(start)});
  }

  const {rows,children} = buildLayout(items);
  const totalHeight = rows.reduce((sum,row) => sum + row.height,0);
  planner.innerHTML = '';
  const timeline = document.createElement('div');
  timeline.className = 'timeline';
  timeline.style.width = `${LABEL_WIDTH + timelineWidth}px`;

  const header = document.createElement('div'); header.className='month-header';
  const corner = document.createElement('div'); corner.className='corner'; corner.textContent='Planning item'; header.append(corner);
  const head = document.createElement('div'); head.className='timeline-head'; head.style.width=`${timelineWidth}px`;
  const monthRow = document.createElement('div'); monthRow.className='month-row';
  months.forEach((month,index) => { const el=document.createElement('div'); el.className='month'; el.style.width=`${month.days*DAY_WIDTH}px`; el.style.background=monthBands[index%monthBands.length]; el.textContent=formatMonth(month.start); monthRow.append(el); });
  const weekRow = document.createElement('div'); weekRow.className='week-row';
  weeks.forEach(week => { const el=document.createElement('div'); el.className='week'; el.style.width=`${week.days*DAY_WIDTH}px`; el.textContent=formatShort(week.start); weekRow.append(el); });
  head.append(monthRow,weekRow); header.append(head); timeline.append(header);

  const rowsEl = document.createElement('div'); rowsEl.className='rows'; rowsEl.style.minHeight=`${totalHeight}px`;
  for (const {item,depth,height,barHeight} of rows) {
    const row = document.createElement('div'); row.className='row'; row.style.height=`${height}px`;
    const label = document.createElement('div'); label.className='row-label'; label.style.paddingLeft=`${10+depth*17}px`;
    const toggle = document.createElement('button'); toggle.className=`row-toggle ${(children.get(item.id)?.length||0) ? '' : 'empty'}`; toggle.textContent=(children.get(item.id)?.length||0) ? (collapsed.has(item.id)?'▸':'▾') : '·';
    toggle.addEventListener('click', () => { if (!(children.get(item.id)?.length||0)) return; collapsed.has(item.id) ? collapsed.delete(item.id) : collapsed.add(item.id); render(currentModel); });
    const dot=document.createElement('span'); dot.className='row-dot'; dot.style.background=item.colour;
    const copy=document.createElement('span'); copy.className='row-copy'; copy.innerHTML=`<strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.team || (depth===0?'Initiative':depth===1?'Sub-initiative':depth===2?'Story':'Task'))}</small>`;
    label.append(toggle,dot,copy);

    const area=document.createElement('div'); area.className='bar-area'; area.style.width=`${timelineWidth}px`; area.style.height=`${height}px`;
    const grid=document.createElement('div'); grid.className='week-grid';
    weeks.forEach(week => { const span=document.createElement('span'); span.style.width=`${week.days*DAY_WIDTH}px`; grid.append(span); }); area.append(grid);

    const left=(dayNumber(item.startDate)-dayNumber(timelineStart))*DAY_WIDTH;
    const width=Math.max(4,(dayNumber(item.endDate)-dayNumber(item.startDate))*DAY_WIDTH);
    const wash=document.createElement('div'); wash.className='washi'; wash.style.cssText=`left:${left}px;top:${Math.max(1,(height-barHeight)/2)}px;width:${width}px;height:${barHeight}px;--bar:${item.colour};--text:${item.textColour}`; wash.innerHTML=`<span>${escapeHtml(item.title)}</span>`; area.append(wash);

    for (const milestone of item.milestones) {
      const week = weeks.find(w => milestone.date >= w.start && milestone.date < w.end);
      const right = (dayNumber(week?.end || milestone.date)-dayNumber(timelineStart))*DAY_WIDTH;
      const marker=document.createElement('div'); marker.className='milestone'; marker.style.left=`${right-32}px`; marker.style.top='2px'; marker.style.setProperty('--milestone',milestoneColours[milestone.type]||'#8A5EBE'); marker.innerHTML=`<div class="marker-tip">${escapeHtml(milestone.title)} · ${formatShort(milestone.date)}</div>`; area.append(marker);
    }

    for (const dependency of item.externalDependencies) {
      const week = weeks.find(w => dependency.date >= w.start && dependency.date < w.end);
      const start = week?.start || dependency.date;
      const cellWidth=(week?.days||7)*DAY_WIDTH;
      const dep=document.createElement('div'); dep.className='external'; dep.style.left=`${(dayNumber(start)-dayNumber(timelineStart))*DAY_WIDTH + Math.max(1,(cellWidth-32)/2)}px`; dep.style.top='7px'; dep.innerHTML=`<svg viewBox="0 0 32 23" aria-hidden="true"><path d="M1 1H31V22H12.5C7.7 22 7 17.2 11.4 15.7C5.9 15.2 5.6 9.6 11.1 8.7C6.8 7.3 7.7 1 13 1Z"/></svg><div class="marker-tip">${escapeHtml(dependency.title)} · ${formatShort(dependency.date)}</div>`; area.append(dep);
    }

    row.append(label,area); rowsEl.append(row);
  }
  timeline.append(rowsEl); planner.append(timeline);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
