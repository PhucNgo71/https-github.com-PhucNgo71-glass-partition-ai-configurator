import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import {
  BadgeCheck,
  Bot,
  DoorOpen,
  Download,
  FileText,
  Grid3X3,
  Layers3,
  Plus,
  Ruler,
  Sparkles,
  Trash2,
} from 'lucide-react';
import './styles.css';

const partitionStcOptions = [35, 38, 45, 49, 51];

const partitionSystems = {
  35: {
    testedStc: 35,
    system: 'VISTA single glazed partition',
    glass: '6+0.5+6 laminated glass',
    frame: 'Single glazed acoustic partition framing',
    note: 'Testing data: VISTA single glazed partition, STC/RW 35. Glass by local supply.',
    frameRate: 26.84,
    glassRate: 79.42,
    powerBarRate: 202.48,
  },
  38: {
    testedStc: 38,
    system: 'P50 single glazed partition',
    glass: '6+0.76+6 laminated glass',
    frame: 'P50 single glazed partition frame and components, 50mm overall',
    note: 'Testing data: P50 single glazed partition, STC/RW 38. Glass by local supply.',
    frameRate: 44.28,
    glassRate: 79.42,
    powerBarRate: 232,
  },
  45: {
    testedStc: 45,
    system: 'E100 double glazed partition',
    glass: '10mm / 12mm clear tempered glass',
    frame: 'E100 double glazed partition frame and components, 100mm overall',
    note: 'Testing data: E100 double glazed partition, STC/RW 45. Frame rate excludes glass.',
    frameRate: 66.42,
    glassRate: 80.38,
    powerBarRate: 315.3,
  },
  49: {
    testedStc: 49,
    system: 'E100 double glazed partition',
    glass: '6+0.76+6 / 5+0.76+5 laminated glass',
    frame: 'E100 double glazed partition frame and components, 100mm overall',
    note: 'Testing data: E100 double glazed partition, STC/RW 49. Frame rate excludes glass.',
    frameRate: 66.42,
    glassRate: 150.66,
    powerBarRate: 315.3,
  },
  51: {
    testedStc: 50,
    system: 'F100 double glazed partition',
    glass: '6+0.76+6 / 5+0.76+5 laminated glass',
    frame: 'F100 high acoustic double glazed partition, validate final project detail',
    note: 'Testing data lists F100 at STC/RW 50. Target STC 51 requires validation or alternate test evidence.',
    frameRate: 66.42,
    glassRate: 150.66,
    powerBarRate: 315.3,
  },
};

const doorTypes = {
  'E100 60mm double glass door': {
    stc: 38,
    origin: 'Imported Spiralis door frame + leaf without glass',
    spec: 'E100 60mm double glass door leaf, 6+6mm clear tempered glass',
    rate: 838,
    source: 'Price list: E100 swing door frame $150.41 + 60mm framed leaf without glass $268.59. Testing data: STC/RW 38.',
  },
  'E100 100mm double glass door': {
    stc: 40,
    origin: 'Imported Spiralis door frame + leaf without glass',
    spec: 'E100 100mm double glass door leaf, 6+6mm clear tempered glass',
    rate: 1215.42,
    source: 'Price list: E100 swing door frame $150.41 + E100 100mm leaf without glass $457.30. Testing data: STC/RW 40.',
  },
  'E60 60mm framed double glass door': {
    stc: 44,
    origin: 'Imported Spiralis door frame + leaf without glass',
    spec: 'E60 60mm framed double glazed door leaf, 6+8mm clear tempered glass',
    rate: 736.6,
    source: 'Revised price list: E60 frame $99.71 + 60mm framed leaf without glass $268.59. SGS report: E60 double glazed door STC 44.',
  },
  'E100 100mm acoustic laminated door': {
    stc: 45,
    origin: 'Imported Spiralis acoustic laminated door package',
    spec: 'E100 100mm double glass door, 5+1.52+5 Saflex acoustic laminated glass double side',
    rate: 1775.18,
    source: 'Price list item 5.4.3. Testing data: E100 100mm acoustic laminated door STC/RW 45.',
  },
};

const initialRooms = [
  {
    id: crypto.randomUUID(),
    name: 'Meeting Room 01',
    layoutType: 'fullSequence',
    width: 4200,
    depth: 3600,
    height: 3000,
    components: {
      partition1Width: 1500,
      partition2Width: 1200,
      door1Width: 900,
      door1Height: 2200,
      door2Width: 900,
      door2Height: 2200,
      powerBarWidth: 320,
    },
    partitionStc: 38,
    doorType: 'E100 60mm double glass door',
    doors: 2,
    powerBar: true,
    notes: 'Standard office meeting room',
  },
  {
    id: crypto.randomUUID(),
    name: 'Focus Room 02',
    layoutType: 'twoPartitionOneDoor',
    width: 3000,
    depth: 2800,
    height: 3000,
    components: {
      partition1Width: 1200,
      partition2Width: 900,
      door1Width: 900,
      door1Height: 2200,
      door2Width: 0,
      door2Height: 2200,
      powerBarWidth: 0,
    },
    partitionStc: 45,
    doorType: 'E60 60mm framed double glass door',
    doors: 1,
    powerBar: false,
    notes: 'Higher acoustic privacy',
  },
];

const tabs = [
  { id: 'builder', label: 'Room Builder', icon: Layers3 },
  { id: 'ai', label: 'AI Recommendation', icon: Bot },
  { id: 'preview', label: '2D Room', icon: Grid3X3 },
  { id: 'boq', label: 'Editable BOQ', icon: FileText },
  { id: 'rules', label: 'Room Rules', icon: BadgeCheck },
];

const layoutOptions = {
  fullSequence: {
    title: 'Full room sequence',
    short: '2 partitions + 2 doors',
    description: 'Partition 1 + Partition 2 + Door 1 + Door 2 + Partition 1 + Partition 2',
    segments: [
      { id: 'p1-a', number: '1', label: 'Partition 1', key: 'partition1Width', tone: 'partition' },
      { id: 'p2-a', number: '2', label: 'Partition 2', key: 'partition2Width', tone: 'partition' },
      { id: 'd1', number: '3', label: 'Door 1', key: 'door1Width', tone: 'door' },
      { id: 'd2', number: '4', label: 'Door 2', key: 'door2Width', tone: 'door' },
      { id: 'pb', label: 'Power Bar', key: 'powerBarWidth', tone: 'power', optional: 'powerBar' },
      { id: 'p1-b', number: '1', label: 'Partition 1', key: 'partition1Width', tone: 'partition', repeat: true },
      { id: 'p2-b', number: '2', label: 'Partition 2', key: 'partition2Width', tone: 'partition', repeat: true },
    ],
  },
  twoPartitionOneDoor: {
    title: '2 partitions with 1 door',
    short: 'P1 + D1 + P2',
    description: 'Partition 1 + Door 1 + Partition 2',
    segments: [
      { id: 'p1', number: '1', label: 'Partition 1', key: 'partition1Width', tone: 'partition' },
      { id: 'd1', number: '3', label: 'Door 1', key: 'door1Width', tone: 'door' },
      { id: 'p2', number: '2', label: 'Partition 2', key: 'partition2Width', tone: 'partition' },
      { id: 'pb', label: 'Power Bar', key: 'powerBarWidth', tone: 'power', optional: 'powerBar' },
    ],
  },
  onePartitionOneDoor: {
    title: '1 partition with 1 door',
    short: 'P1 + D1',
    description: 'Partition 1 + Door 1',
    segments: [
      { id: 'p1', number: '1', label: 'Partition 1', key: 'partition1Width', tone: 'partition' },
      { id: 'd1', number: '3', label: 'Door 1', key: 'door1Width', tone: 'door' },
      { id: 'pb', label: 'Power Bar', key: 'powerBarWidth', tone: 'power', optional: 'powerBar' },
    ],
  },
  onePartitionTwoDoor: {
    title: '1 partition with 2 doors',
    short: 'P1 + D1 + D2',
    description: 'Partition 1 + Door 1 + Door 2',
    visible: false,
    segments: [
      { id: 'p1', number: '1', label: 'Partition 1', key: 'partition1Width', tone: 'partition' },
      { id: 'd1', number: '3', label: 'Door 1', key: 'door1Width', tone: 'door' },
      { id: 'd2', number: '4', label: 'Door 2', key: 'door2Width', tone: 'door' },
      { id: 'pb', label: 'Power Bar', key: 'powerBarWidth', tone: 'power', optional: 'powerBar' },
    ],
  },
};

function getLayout(room) {
  return layoutOptions[room.layoutType] ?? layoutOptions.fullSequence;
}

function getRoomRuleDescription(room) {
  const layout = getLayout(room);
  return getPowerBarLengthMm(room) > 0 ? `${layout.description} + Power Bar` : layout.description;
}

function getLayoutInputKeys(room) {
  return new Set(getLayout(room).segments.filter((segment) => segment.tone !== 'power').map((segment) => segment.key));
}

function getRoomAddActions(room) {
  const inputKeys = getLayoutInputKeys(room);
  return [
    {
      id: 'partition',
      label: '+ Partition',
      description: inputKeys.has('partition2Width') ? 'Partition 2 already included' : 'Add Partition 2 to this room',
      disabled: inputKeys.has('partition2Width'),
    },
    {
      id: 'door',
      label: '+ Door',
      description: inputKeys.has('door2Width') ? 'Door 2 already included' : 'Add Door 2 to this room',
      disabled: inputKeys.has('door2Width'),
    },
    {
      id: 'powerBar',
      label: '+ Power Bar',
      description: getPowerBarLengthMm(room) > 0 ? 'Power Bar already included' : 'Set Power Bar width above 0',
      disabled: getPowerBarLengthMm(room) > 0,
    },
  ];
}

function applyRoomAddAction(room, actionId) {
  const components = getComponents(room);
  const patch = {};

  if (actionId === 'partition') {
    patch.layoutType = room.layoutType === 'onePartitionOneDoor' ? 'twoPartitionOneDoor' : 'fullSequence';
    patch.components = {
      ...components,
      partition2Width: Number(components.partition2Width) > 0 ? Number(components.partition2Width) : 1200,
    };
  }

  if (actionId === 'door') {
    patch.layoutType = getLayoutInputKeys(room).has('partition2Width') ? 'fullSequence' : 'onePartitionTwoDoor';
    patch.components = {
      ...components,
      door2Width: Number(components.door2Width) > 0 ? Number(components.door2Width) : 900,
      door2Height: Number(components.door2Height) > 0 ? Number(components.door2Height) : Number(components.door1Height) || 2200,
    };
  }

  if (actionId === 'powerBar') {
    patch.powerBar = true;
    patch.components = {
      ...components,
      powerBarWidth: Number(components.powerBarWidth) > 0 ? Number(components.powerBarWidth) : 320,
    };
  }

  return patch;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const defaultComponents = {
  partition1Width: 1200,
  partition2Width: 1200,
  door1Width: 900,
  door1Height: 2200,
  door2Width: 0,
  door2Height: 2200,
  powerBarWidth: 0,
};

function getComponents(room) {
  return { ...defaultComponents, ...(room.components ?? {}) };
}

function getDoorCount(room) {
  const components = getComponents(room);
  const doorKeys = new Set(getLayout(room).segments.filter((segment) => segment.tone === 'door').map((segment) => segment.key));
  return [...doorKeys].filter((key) => Number(components[key]) > 0).length;
}

function getPartitionLengthMm(room) {
  const components = getComponents(room);
  return getLayout(room).segments
    .filter((segment) => segment.tone === 'partition')
    .reduce((sum, segment) => sum + Number(components[segment.key]), 0);
}

function getPowerBarLengthMm(room) {
  return Math.max(0, Number(getComponents(room).powerBarWidth) || 0);
}

function getTotalRunLengthMm(room) {
  return getRoomMapSegments(room).reduce((sum, segment) => sum + Number(segment.width), 0);
}

function getRoomHeight(room, projectHeight, sameHeightForAllRooms = true) {
  return sameHeightForAllRooms ? Number(projectHeight) : Number(room.height || projectHeight);
}

function areaForRoom(room, height, sameHeightForAllRooms = true) {
  return ((getPartitionLengthMm(room) * getRoomHeight(room, height, sameHeightForAllRooms)) / 1_000_000).toFixed(2);
}

function totalSqmForRoom(room, height, sameHeightForAllRooms = true) {
  return (((Number(room.width) * Number(room.depth) * getRoomHeight(room, height, sameHeightForAllRooms)) / 1_000_000_000)).toFixed(2);
}

function perimeterForRoom(room) {
  return (getTotalRunLengthMm(room) / 1000).toFixed(2);
}

function buildBoq(rooms, height, sameHeightForAllRooms = true) {
  return rooms.flatMap((room) => {
    const partition = partitionSystems[room.partitionStc];
    const door = doorTypes[room.doorType];
    const area = Number(areaForRoom(room, height, sameHeightForAllRooms));
    const doorCount = getDoorCount(room);
    const rows = [
      {
        id: `${room.id}-partition-frame`,
        room: room.name,
        category: 'Partition',
        description: `${partition.frame}. Target STC ${room.partitionStc}, tested STC ${partition.testedStc}`,
        origin: 'Spiralis frame/components, price list excludes glass',
        qty: area,
        unit: 'm2',
        rate: partition.frameRate,
      },
      {
        id: `${room.id}-partition-glass`,
        room: room.name,
        category: 'Glass',
        description: `${partition.glass} for ${partition.system}`,
        origin: 'Local glass supply reference line',
        qty: area,
        unit: 'm2',
        rate: partition.glassRate,
      },
    ];

    if (doorCount > 0) {
      rows.push({
        id: `${room.id}-door`,
        room: room.name,
        category: 'Door',
        description: `${door.spec}, STC ${door.stc}`,
        origin: door.origin,
        qty: doorCount,
        unit: 'set',
        rate: door.rate,
      });
    }

    if (getPowerBarLengthMm(room) > 0) {
      rows.push({
        id: `${room.id}-power-bar`,
        room: room.name,
        category: 'Power Bar',
        description: `Cable passing / power bar element, W=${getPowerBarLengthMm(room)}mm`,
        origin: 'Spiralis equipment leaf / cable passing element',
        qty: 1,
        unit: 'no.',
        rate: partition.powerBarRate,
      });
    }

    return rows;
  });
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date());
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addPageIfNeeded(doc, y, bottom = 275) {
  if (y <= bottom) return y;
  doc.addPage();
  return 22;
}

function drawTableHeader(doc, columns, y) {
  doc.setFillColor(31, 93, 85);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  columns.forEach((column) => doc.text(column.label, column.x, y));
  doc.setTextColor(32, 32, 29);
  doc.setFont('helvetica', 'normal');
  return y + 8;
}

function App() {
  const [height, setHeight] = useState(3000);
  const [sameHeightForAllRooms, setSameHeightForAllRooms] = useState(true);
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRooms[0].id);
  const [boqOverrides, setBoqOverrides] = useState({});
  const [activeTab, setActiveTab] = useState('builder');
  const [projectInfo, setProjectInfo] = useState({
    projectName: 'Office glass partition package',
    clientName: '',
  });

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const selectedDoor = doorTypes[selectedRoom.doorType];
  const selectedPartition = partitionSystems[selectedRoom.partitionStc];
  const boqRows = useMemo(() => buildBoq(rooms, height, sameHeightForAllRooms), [rooms, height, sameHeightForAllRooms]);
  const editedBoq = boqRows.map((row) => ({ ...row, ...boqOverrides[row.id] }));
  const total = editedBoq.reduce((sum, row) => sum + Number(row.qty) * Number(row.rate), 0);

  const updateRoom = (id, patch) => {
    setRooms((current) =>
      current.map((room) => {
        if (room.id !== id) return room;
        const next = { ...room, ...patch };
        if (patch.doorType) next.doorStc = doorTypes[patch.doorType].stc;
        return next;
      }),
    );
  };

  const addRoom = () => {
    const room = {
      id: crypto.randomUUID(),
      name: `Room ${String(rooms.length + 1).padStart(2, '0')}`,
      width: 3600,
      depth: 3200,
      height,
      components: { ...defaultComponents },
      layoutType: 'twoPartitionOneDoor',
      partitionStc: 38,
      doorType: 'E100 60mm double glass door',
      doors: 1,
      powerBar: false,
      notes: '',
    };
    setRooms((current) => [...current, room]);
    setSelectedRoomId(room.id);
    setActiveTab('builder');
  };

  const removeRoom = (id) => {
    if (rooms.length === 1) return;
    const nextRooms = rooms.filter((room) => room.id !== id);
    setRooms(nextRooms);
    if (selectedRoomId === id) setSelectedRoomId(nextRooms[0].id);
  };

  const updateBoq = (id, field, value) => {
    setBoqOverrides((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: field === 'qty' || field === 'rate' ? Number(value) : value,
      },
    }));
  };

  const exportProposal = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(31, 93, 85);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Glass Partition AI Configurator', 14, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Proposal generated ${todayLabel()}`, 14, 25);

    doc.setTextColor(32, 32, 29);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Project Summary', 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Project: ${projectInfo.projectName || 'Untitled project'}`, 14, 57);
    doc.text(`Client: ${projectInfo.clientName || 'Not specified'}`, 14, 64);
    doc.text(`Project height: ${height} mm`, 108, 57);
    doc.text(`Height rule: ${sameHeightForAllRooms ? 'same height for all rooms' : 'room-specific heights'}`, 108, 64);

    doc.setFillColor(244, 242, 237);
    doc.roundedRect(14, 72, 182, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Commercial Snapshot', 20, 82);
    doc.setFontSize(16);
    doc.text(currency(total), 150, 82, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${rooms.length} room(s), ${editedBoq.length} BOQ line item(s)`, 20, 89);
    doc.text('Subject to site measurement, final shop drawings, and approved hardware schedule.', 150, 89, {
      align: 'right',
    });

    let y = 108;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Room Schedule', 14, y);
    y += 9;
    y = drawTableHeader(doc, [
      { label: 'Room', x: 16 },
      { label: 'Size', x: 58 },
      { label: 'Partition', x: 91 },
      { label: 'Door', x: 121 },
      { label: 'Qty', x: 184 },
    ], y);
    doc.setFontSize(8);
    rooms.forEach((room) => {
      y = addPageIfNeeded(doc, y);
      const door = doorTypes[room.doorType];
      doc.setDrawColor(230, 224, 214);
      doc.line(14, y + 2, 196, y + 2);
      doc.text(room.name, 16, y);
      doc.text(`${perimeterForRoom(room)} lm, H ${getRoomHeight(room, height, sameHeightForAllRooms)}mm`, 58, y);
      doc.text(`STC ${room.partitionStc}`, 91, y);
      doc.text(`${room.doorType}, STC ${door.stc}`, 121, y, { maxWidth: 55 });
      doc.text(String(getDoorCount(room)), 188, y, { align: 'right' });
      y += 9;
    });

    y += 8;
    y = addPageIfNeeded(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Bill of Quantities', 14, y);
    y += 9;
    y = drawTableHeader(doc, [
      { label: 'Room / Item', x: 16 },
      { label: 'Description', x: 48 },
      { label: 'Qty', x: 135 },
      { label: 'Rate', x: 153 },
      { label: 'Amount', x: 185 },
    ], y);
    doc.setFontSize(8);
    editedBoq.forEach((row) => {
      y = addPageIfNeeded(doc, y);
      const startY = y;
      const description = `${row.category}: ${row.description}. ${row.origin}.`;
      doc.setDrawColor(230, 224, 214);
      doc.line(14, startY + 2, 196, startY + 2);
      doc.setFont('helvetica', 'bold');
      doc.text(row.room, 16, y);
      doc.setFont('helvetica', 'normal');
      const descHeightY = addWrappedText(doc, description, 48, y, 78, 4);
      doc.text(`${row.qty} ${row.unit}`, 135, y);
      doc.text(currency(row.rate), 168, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(currency(row.qty * row.rate), 195, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y = Math.max(descHeightY + 3, startY + 9);
    });

    y = addPageIfNeeded(doc, y + 4);
    doc.setDrawColor(31, 93, 85);
    doc.line(118, y, 196, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Estimated Total', 135, y);
    doc.setFontSize(16);
    doc.text(currency(total), 195, y, { align: 'right' });

    y = addPageIfNeeded(doc, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Proposal Notes', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    addWrappedText(
      doc,
      'This proposal is generated from the current configurator state. BOQ quantities are editable estimates based on user-entered partition, door, power bar, and room height dimensions. Final pricing should be validated against site conditions, approved specifications, and procurement lead times.',
      14,
      y + 8,
      182,
      4.5,
    );

    const pageCount = doc.getNumberOfPages();
    for (let index = 1; index <= pageCount; index += 1) {
      doc.setPage(index);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 109, 100);
      doc.text(`Page ${index} of ${pageCount}`, 196, 288, { align: 'right' });
      doc.text('Glass Partition AI Configurator', 14, 288);
    }

    doc.save('glass-partition-ai-proposal.pdf');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Ergovn Co., LTD</Badge>
              <Badge tone="soft">Glass Partition AI Configurator</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Premium estimating workspace</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Build rooms, not product codes.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Configure room dimensions, tested acoustic systems, Spiralis frame/door components, local glass supply, and sell pricing in one clean dashboard.
              </p>
            </div>
          </div>
          <button onClick={exportProposal} className="primary-button">
            <Download size={18} />
            Export Proposal
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card title="Project Setup" icon={Ruler}>
            <div className="space-y-5">
              <Field label="Project Name">
                <input
                  value={projectInfo.projectName}
                  onChange={(event) => setProjectInfo((current) => ({ ...current, projectName: event.target.value }))}
                  className="field"
                />
              </Field>
              <Field label="Client Name">
                <input
                  value={projectInfo.clientName}
                  placeholder="Optional"
                  onChange={(event) => setProjectInfo((current) => ({ ...current, clientName: event.target.value }))}
                  className="field"
                />
              </Field>
              <Field label="Project Height">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="2400"
                    max="4200"
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value))}
                    className="field"
                  />
                  <span className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">mm</span>
                </div>
              </Field>
              <input
                type="range"
                min="2400"
                max="4200"
                step="50"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
                className="app-slider w-full"
              />
              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={sameHeightForAllRooms}
                  onChange={(event) => setSameHeightForAllRooms(event.target.checked)}
                  className="h-4 w-4 accent-[#2563eb]"
                />
                Same height for all rooms
              </label>
              {!sameHeightForAllRooms && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                  Room-specific height is active. Set each room height inside Room Builder.
                </p>
              )}
            </div>
          </Card>

          <Card title="Rooms" icon={Layers3}>
            <div className="space-y-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedRoom.id === room.id
                      ? 'border-[#2563eb] bg-[#eff6ff] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{room.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Run {perimeterForRoom(room)} lm, H {getRoomHeight(room, height, sameHeightForAllRooms)} mm, glass {areaForRoom(room, height, sameHeightForAllRooms)} m2
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      STC {room.partitionStc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={addRoom} className="secondary-button mt-4 w-full">
              <Plus size={17} />
              Add Room
            </button>
          </Card>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <SummaryCard
              label="Height"
              value={`${getRoomHeight(selectedRoom, height, sameHeightForAllRooms)} mm`}
              detail={sameHeightForAllRooms ? 'All rooms' : selectedRoom.name}
              icon={Ruler}
            />
            <SummaryCard label="System" value={`STC ${selectedRoom.partitionStc}`} detail={selectedPartition.glass} icon={Layers3} />
            <SummaryCard label="Door Type" value={`STC ${selectedDoor.stc}`} detail={selectedRoom.doorType} icon={DoorOpen} />
            <SummaryCard label="Sell Price" value={currency(total)} detail={`${editedBoq.length} BOQ lines`} icon={FileText} />
          </div>

          <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex gap-2 overflow-x-auto p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-3 md:p-5">
              {activeTab === 'builder' && (
                <RoomBuilder
                  room={selectedRoom}
                  updateRoom={updateRoom}
                  removeRoom={removeRoom}
                  rooms={rooms}
                  selectedDoor={selectedDoor}
                  selectedPartition={selectedPartition}
                  height={height}
                  sameHeightForAllRooms={sameHeightForAllRooms}
                />
              )}
              {activeTab === 'ai' && (
                <AiRecommendation room={selectedRoom} selectedDoor={selectedDoor} selectedPartition={selectedPartition} height={height} sameHeightForAllRooms={sameHeightForAllRooms} />
              )}
              {activeTab === 'preview' && <RoomPreview room={selectedRoom} height={height} sameHeightForAllRooms={sameHeightForAllRooms} premium />}
              {activeTab === 'boq' && (
                <BoqCards rows={editedBoq} updateBoq={updateBoq} total={total} exportProposal={exportProposal} />
              )}
              {activeTab === 'rules' && <RoomRules room={selectedRoom} height={height} sameHeightForAllRooms={sameHeightForAllRooms} selectedDoor={selectedDoor} />}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Badge({ children, tone }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${
        tone === 'soft' ? 'bg-blue-50 text-blue-700' : 'bg-slate-950 text-white'
      }`}
    >
      {children}
    </span>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon size={20} />
        </span>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{detail}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function RoomBuilder({ room, updateRoom, removeRoom, rooms, selectedDoor, selectedPartition, height, sameHeightForAllRooms }) {
  const components = getComponents(room);
  const layout = getLayout(room);
  const activeInputKeys = getLayoutInputKeys(room);
  const addActions = getRoomAddActions(room);
  const usesDoor2 = activeInputKeys.has('door2Width');
  const roomHeight = getRoomHeight(room, height, sameHeightForAllRooms);
  const updateComponent = (key, value) => {
    const numericValue = Number(value);
    updateRoom(room.id, {
      ...(key === 'powerBarWidth' ? { powerBar: numericValue > 0 } : {}),
      components: {
        ...components,
        [key]: numericValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Room Builder</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{room.name}</h2>
        </div>
        <button
          onClick={() => removeRoom(room.id)}
          disabled={rooms.length === 1}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
          Remove Room
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <BuilderBox title="Room Name" icon={Grid3X3} className="lg:col-span-2">
          <div className="space-y-4">
            <Field label="Room Name">
              <input
                value={room.name}
                onChange={(event) => updateRoom(room.id, { name: event.target.value })}
                className="h-16 w-full rounded-3xl border border-slate-200 bg-white px-5 text-xl font-semibold tracking-tight text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Length (mm)">
                <input
                  type="number"
                  value={room.width}
                  onChange={(event) => updateRoom(room.id, { width: Number(event.target.value) })}
                  className="field"
                />
              </Field>
              <Field label="Width (mm)">
                <input
                  type="number"
                  value={room.depth}
                  onChange={(event) => updateRoom(room.id, { depth: Number(event.target.value) })}
                  className="field"
                />
              </Field>
              <Field label="Partition Height (mm)">
                <input
                  type="number"
                  min="0"
                  disabled={sameHeightForAllRooms}
                  value={roomHeight}
                  onChange={(event) => updateRoom(room.id, { height: Number(event.target.value) })}
                  className="field disabled:bg-slate-100 disabled:text-slate-500"
                />
              </Field>
              <InfoPill label="Total sqm" value={`${totalSqmForRoom(room, height, sameHeightForAllRooms)} sqm`} />
            </div>
            <p className="text-sm font-medium text-slate-500">
              Total sqm = Length x Width x Height. {sameHeightForAllRooms ? 'Height is controlled by Project Setup.' : 'Room height can be different, for example 600 mm.'}
            </p>
          </div>
        </BuilderBox>

        <BuilderBox title="Room Rule" icon={BadgeCheck} className="lg:col-span-2">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {addActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                onClick={() => updateRoom(room.id, applyRoomAddAction(room, action.id))}
                className={`rounded-3xl border p-4 text-left transition ${
                  action.disabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-blue-100 bg-white text-slate-800 shadow-sm hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${action.disabled ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'}`}>
                  {action.label.replace('+ ', '')} +
                </span>
                <span className="mt-2 block text-sm font-medium leading-5 text-slate-500">{action.description}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {Object.entries(layoutOptions).filter(([, option]) => option.visible !== false).map(([key, option]) => {
              const active = room.layoutType === key || (!room.layoutType && key === 'fullSequence');
              return (
                <button
                  key={key}
                  onClick={() => updateRoom(room.id, { layoutType: key })}
                  className={`rounded-3xl border p-4 text-left transition ${
                    active
                      ? 'border-blue-600 bg-blue-50 shadow-sm ring-4 ring-blue-600/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>
                    {option.short}
                  </span>
                  <span className="mt-3 block text-base font-semibold text-slate-950">{option.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-500">{option.description}</span>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Power Bar optional</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Selected rule</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{getRoomRuleDescription(room)}</p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Partition STC request</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {partitionStcOptions.map((stc) => (
                  <button
                    key={stc}
                    onClick={() => updateRoom(room.id, { partitionStc: stc })}
                    className={`h-11 rounded-2xl text-sm font-bold transition ${
                      room.partitionStc === stc ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {stc}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{selectedPartition.system}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <Field label="Door Type / Door STC request">
                <select value={room.doorType} onChange={(event) => updateRoom(room.id, { doorType: event.target.value })} className="field">
                  {Object.keys(doorTypes).map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <InfoPill label="Door STC" value={selectedDoor.stc} />
                <InfoPill label="Door spec" value={selectedDoor.spec} />
              </div>
            </div>
          </div>
        </BuilderBox>
      </div>

      <RoomConfigurationMap room={room} height={height} sameHeightForAllRooms={sameHeightForAllRooms} updateComponent={updateComponent} updateRoom={updateRoom} editable />

      <div className="grid gap-5 lg:grid-cols-2">
        <BuilderBox title="Dimension Inputs" icon={Ruler}>
          <div className="grid gap-4 md:grid-cols-2">
            {activeInputKeys.has('partition1Width') && (
              <DimensionInput
                number="1"
                title="Partition 1"
                value={components.partition1Width}
                onChange={(value) => updateComponent('partition1Width', value)}
              />
            )}
            {activeInputKeys.has('partition2Width') && (
              <DimensionInput
                number="2"
                title="Partition 2"
                value={components.partition2Width}
                onChange={(value) => updateComponent('partition2Width', value)}
              />
            )}
            {activeInputKeys.has('door1Width') && (
              <DimensionInput
                number="3"
                title="Door 1"
                value={components.door1Width}
                onChange={(value) => updateComponent('door1Width', value)}
                helper={`Height ${components.door1Height} mm`}
              />
            )}
            {usesDoor2 && (
              <DimensionInput
                number="4"
                title="Door 2"
                value={components.door2Width}
                onChange={(value) => updateComponent('door2Width', value)}
                helper={`Height ${components.door2Height} mm`}
              />
            )}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Door 1 height (mm)">
              <input
                type="number"
                value={components.door1Height}
                onChange={(event) => updateComponent('door1Height', event.target.value)}
                className="field"
              />
            </Field>
            {usesDoor2 && (
              <Field label="Door 2 height (mm)">
                <input
                  type="number"
                  value={components.door2Height}
                  onChange={(event) => updateComponent('door2Height', event.target.value)}
                  className="field"
                />
              </Field>
            )}
          </div>
        </BuilderBox>

        <BuilderBox title="Add More Partition" icon={Plus}>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoPill label="Supply" value="Local glass" />
            <InfoPill label="Area" value={`${areaForRoom(room, height, sameHeightForAllRooms)} m2`} />
            <InfoPill label="System" value={`STC ${room.partitionStc}`} />
            <InfoPill label="Glass" value={selectedPartition.glass} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Partition quantity follows the selected room rule. Door openings are counted separately from partition area.
          </p>
        </BuilderBox>
      </div>
    </div>
  );
}

function BuilderBox({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
        <h3 className="font-semibold text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DimensionInput({ number, title, value, onChange, helper }) {
  return (
    <label className="block rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <span className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">
          {number}
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-950">{title}</span>
          <span className="block text-xs font-medium text-slate-500">{helper ?? 'Width input'}</span>
        </span>
      </span>
      <span className="block">
        <input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="field text-base font-semibold" />
        <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">mm</span>
      </span>
    </label>
  );
}

function AiRecommendation({ room, selectedDoor, selectedPartition, height, sameHeightForAllRooms }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-3">
          <Sparkles size={20} />
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-blue-200">AI Recommendation</p>
        </div>
        <h2 className="mt-5 text-2xl font-semibold">Use STC {room.partitionStc} partition with STC {selectedDoor.stc} door package.</h2>
        <p className="mt-4 leading-7 text-slate-300">
          The selected room dimensions produce {areaForRoom(room, height, sameHeightForAllRooms)} m2 of partition area. Partition frames use Spiralis price-list rates excluding glass, glass is shown as a local supply reference line, and door pricing follows the revised door-without-glass list unless noted.
        </p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-950">Recommended System</h3>
        <div className="mt-4 space-y-3">
          <InfoPill label="Partition frame" value={selectedPartition.frame} />
          <InfoPill label="Partition glass" value={selectedPartition.glass} />
          <InfoPill label="Test basis" value={selectedPartition.note} />
          <InfoPill label="Door spec" value={selectedDoor.spec} />
          <InfoPill label="Door origin" value={selectedDoor.origin} />
          <InfoPill label="Door source" value={selectedDoor.source} />
        </div>
      </section>
    </div>
  );
}

function BoqCards({ rows, updateBoq, total, exportProposal }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Editable BOQ</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Review scope and sell price</h2>
        </div>
        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-right text-white">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-300">Sell Price</p>
          <p className="mt-1 text-2xl font-semibold">{currency(total)}</p>
        </div>
      </div>
      <div className="grid gap-4">
        {rows.map((row) => (
          <section key={row.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{row.room}</p>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{row.category}</p>
              </div>
              <p className="text-xl font-semibold text-slate-950">{currency(row.qty * row.rate)}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.4fr_0.4fr]">
              <Field label="Description">
                <input value={row.description} onChange={(event) => updateBoq(row.id, 'description', event.target.value)} className="field" />
              </Field>
              <Field label="Origin">
                <input value={row.origin} onChange={(event) => updateBoq(row.id, 'origin', event.target.value)} className="field" />
              </Field>
              <Field label={`Qty ${row.unit}`}>
                <input type="number" value={row.qty} onChange={(event) => updateBoq(row.id, 'qty', event.target.value)} className="field" />
              </Field>
              <Field label="Rate">
                <input type="number" value={row.rate} onChange={(event) => updateBoq(row.id, 'rate', event.target.value)} className="field" />
              </Field>
            </div>
          </section>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-3xl bg-blue-50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-blue-950">Ready to send?</p>
          <p className="mt-1 text-sm text-blue-700">Export includes the current room logic, BOQ edits, and proposal total.</p>
        </div>
        <button onClick={exportProposal} className="primary-button">
          <Download size={18} />
          Export Proposal
        </button>
      </div>
    </div>
  );
}

function RoomRules({ room, height, sameHeightForAllRooms, selectedDoor }) {
  const layout = getLayout(room);
  const roomHeight = getRoomHeight(room, height, sameHeightForAllRooms);
  const rules = [
    ['Project height first', `${height} mm is the default project height.`],
    ['Same height for all rooms', sameHeightForAllRooms ? 'Enabled for this configuration.' : `Disabled. This room uses ${roomHeight} mm.`],
    ['Room rule option', `${layout.title}: ${getRoomRuleDescription(room)}.`],
    ['User input dimensions', 'Partition, door, and power bar dimensions are entered by users and drive BOQ quantities.'],
    ['Partition quantity', `Partition area uses ${((getPartitionLengthMm(room) / 1000)).toFixed(2)} lm x ${roomHeight} mm height.`],
    ['Door quantity', `Door quantity is counted from Door 1 and Door 2 width inputs: ${getDoorCount(room)} set(s).`],
    ['Partition STC request', `Allowed values are ${partitionStcOptions.join(', ')}.`],
    ['Door STC linked to door type', `${room.doorType} maps to STC ${selectedDoor.stc}.`],
    ['STC38 door', 'E100 60mm double glass door with 6+6mm clear tempered glass.'],
    ['E60 tested door', 'E60 60mm framed double glazed door with 6+8mm clear tempered glass, SGS STC 44.'],
    ['Partition frame pricing', 'Spiralis frame/component rates exclude glass.'],
    ['Partition glass', 'Shown as local supply reference line.'],
    ['Door pricing basis', 'Revised price list is door without glass unless the acoustic laminated E100 package is selected.'],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rules.map(([label, value]) => (
        <section key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <BadgeCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
            <div>
              <p className="font-semibold text-slate-950">{label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{value}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function getRoomMapSegments(room) {
  const components = getComponents(room);
  return getLayout(room).segments
    .filter((segment) => !segment.optional || Number(components[segment.key]) > 0)
    .map((segment) => ({
      ...segment,
      valueKey: segment.key,
      width: Number(components[segment.key]),
    }))
    .filter((segment) => segment.width > 0);
}

function RoomConfigurationMap({ room, height, sameHeightForAllRooms = true, updateComponent, updateRoom, editable = false }) {
  const components = getComponents(room);
  const layout = getLayout(room);
  const segments = getRoomMapSegments(room);
  const totalWidth = segments.reduce((sum, segment) => sum + segment.width, 0) || 1;
  const dimensionSegments = segments.reduce(
    (items, segment) => {
      const start = items.cursor;
      const end = start + segment.width;
      items.rows.push({ ...segment, start, end });
      items.cursor = end;
      return items;
    },
    { cursor: 0, rows: [] },
  ).rows;
  const activeInputKeys = getLayoutInputKeys(room);
  const mapInputs = [
    { number: '1', label: 'Partition 1', key: 'partition1Width', value: components.partition1Width },
    { number: '2', label: 'Partition 2', key: 'partition2Width', value: components.partition2Width },
    { number: '3', label: 'Door 1', key: 'door1Width', value: components.door1Width },
    { number: '4', label: 'Door 2', key: 'door2Width', value: components.door2Width },
    { number: '+', label: 'Power Bar', key: 'powerBarWidth', value: components.powerBarWidth, helper: '0 = no power bar' },
  ].filter((item) => activeInputKeys.has(item.key));
  const mapInputsWithPowerBar = [
    ...mapInputs,
    { number: '+', label: 'Power Bar', key: 'powerBarWidth', value: components.powerBarWidth, helper: '0 = no power bar' },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Room Configuration Map</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{room.name}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Choose the room rule first, then key in only the dimensions used by that rule.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[620px]">
          {mapInputsWithPowerBar.map((item) => (
            <label key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{item.number}</span>
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
              </span>
              {editable ? (
                <span className="mt-4 block">
                  <input
                    type="number"
                    value={item.value}
                    onChange={(event) => updateComponent(item.key, event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{item.helper ?? 'mm'}</span>
                </span>
              ) : (
                <span className="mt-3 block">
                  <span className="text-sm font-bold text-slate-950">{item.value}</span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{item.helper ?? 'mm'}</span>
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
            <span className="text-slate-400">Rule:</span> {getRoomRuleDescription(room)}
          </div>
          <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
            {perimeterForRoom(room)} lm total run
          </span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
          <div className="min-w-[720px]">
            <div className="relative h-24 rounded-2xl bg-slate-50 px-4">
              <div className="absolute left-4 right-4 top-1/2 border-t-2 border-slate-800" />
              <div className="absolute left-4 top-[calc(50%-16px)] h-8 border-l-2 border-slate-800" />
              <div className="absolute right-4 top-[calc(50%-16px)] h-8 border-l-2 border-slate-800" />
              {dimensionSegments.map((segment, index) => {
                const left = `${(segment.start / totalWidth) * 100}%`;
                const width = `${Math.max(7, (segment.width / totalWidth) * 100)}%`;
                return (
                  <div
                    key={`${segment.id}-line`}
                    className="absolute top-0 flex h-full flex-col items-center justify-between px-1 py-2 text-center"
                    style={{ left, width }}
                  >
                    {index > 0 && <span className="absolute left-0 top-[calc(50%-12px)] h-6 border-l border-slate-400" />}
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm">{segment.label}</span>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">{segment.width} mm</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex min-h-[150px] items-stretch overflow-x-auto pb-2">
            {segments.map((segment, index) => {
            const flexBasis = `${Math.max(8, (segment.width / totalWidth) * 100)}%`;
            const toneClass =
              segment.tone === 'door'
                ? 'border-amber-300 bg-amber-100 text-amber-950'
                : segment.tone === 'power'
                  ? 'border-violet-300 bg-violet-100 text-violet-950'
                  : 'border-blue-300 bg-blue-100 text-blue-950';
            return (
              <div
                key={segment.id}
                className={`relative z-10 mx-1 flex min-w-[128px] flex-col justify-center gap-3 rounded-2xl border p-3 text-center shadow-sm ${toneClass}`}
                style={{ flexBasis }}
              >
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xs font-bold shadow-sm">
                  {segment.number ?? index + 1}
                </span>
                <span>
                  <span className="block text-xs font-bold">{segment.label}</span>
                  {segment.repeat && <span className="block text-[11px] font-semibold opacity-70">repeat</span>}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold">{segment.width} mm</span>
              </div>
            );
          })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <InfoPill label="Partition length" value={`${(getPartitionLengthMm(room) / 1000).toFixed(2)} lm`} />
          <InfoPill label="Door count" value={getDoorCount(room)} />
          <InfoPill label="Power Bar" value={getPowerBarLengthMm(room) > 0 ? `${getPowerBarLengthMm(room)} mm` : 'Not included'} />
          <InfoPill label="Total run" value={`${perimeterForRoom(room)} lm`} />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Height" value={`${getRoomHeight(room, height, sameHeightForAllRooms)} mm`} />
        <Metric label="Total sqm" value={`${totalSqmForRoom(room, height, sameHeightForAllRooms)} sqm`} />
        <Metric label="Partition" value={`STC ${room.partitionStc}`} />
        <Metric label="Door" value={`STC ${doorTypes[room.doorType].stc}`} />
      </dl>
    </section>
  );
}

function RoomPreview({ room, height, sameHeightForAllRooms, premium }) {
  return (
    <div className={premium ? 'min-h-[560px]' : ''}>
      <RoomConfigurationMap room={room} height={height} sameHeightForAllRooms={sameHeightForAllRooms} />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
