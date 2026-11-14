/**
 * utils/icons.js
 * Catálogo selectivo y optimizado de íconos Lucide.
 * En lugar de importar los 1500+ íconos de la librería completa,
 * importa únicamente los utilizados en la aplicación, reduciendo masivamente
 * el tamaño del bundle de JavaScript.
 */

import {
  createElement,
  Activity,
  AlignCenter,
  AlignLeft,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Anchor,
  Archive,
  ArrowDown,
  ArrowDownToLine,
  ArrowDownAZ,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUpToLine,
  Award,
  BadgeX,
  Ban,
  Binary,
  BarChart3,
  BatteryCharging,
  Bold,
  Bomb,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  Boxes,
  Brain,
  BrainCircuit,
  Briefcase,
  Camera,
  Check,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Circle,
  CircleSlash,
  CircleSlashed,
  Clapperboard,
  Clipboard,
  ClipboardList,
  Clock,
  Clover,
  Code2,
  Coffee,
  Coins,
  Compass,
  Contact,
  Copy,
  CopyCheck,
  CopyPlus,
  Cpu,
  Crop,
  Crosshair,
  Crown,
  Database,
  Dice5,
  Dna,
  Download,
  DownloadCloud,
  Droplet,
  DropletOff,
  Dumbbell,
  Edit2,
  Edit3,
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  FileCheck2,
  FileSearch,
  FileText,
  FileX,
  Film,
  Filter,
  Flag,
  Flame,
  FlipHorizontal,
  FlipVertical,
  Folder,
  FolderArchive,
  FolderKanban,
  FolderMinus,
  FolderOpen,
  FolderOutput,
  FolderPlus,
  Folders,
  FolderUp,
  Footprints,
  Frown,
  Gamepad2,
  Gauge,
  Gem,
  Ghost,
  GitFork,
  GitCommit,
  GitCompare,
  GitMerge,
  Glasses,
  Globe,
  Grid,
  GripVertical,
  Hand,
  HardDrive,
  Hash,
  Heading,
  Heart,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  History,
  Hourglass,
  IdCard,
  Image,
  ImageOff,
  ImagePlus,
  ImageUp,
  Images,
  Info,
  Keyboard,
  Lamp,
  Languages,
  Layers,
  Layout,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Link,
  ListChecks,
  ListFilter,
  ListTodo,
  Loader2,
  Lock,
  MapPin,
  Maximize2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Mic,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  Move,
  MoveHorizontal,
  MoveVertical,
  Music,
  Network,
  Package,
  PackageOpen,
  Palette,
  PauseCircle,
  PawPrint,
  PenLine,
  Pencil,
  Pipette,
  Plus,
  PlusCircle,
  Printer,
  Puzzle,
  Quote,
  Ratio,
  Recycle,
  RefreshCw,
  Repeat,
  RotateCcw,
  RotateCw,
  Rows3,
  Ruler,
  Save,
  Scale,
  Scan,
  ScanFace,
  Scissors,
  ScrollText,
  Search,
  SearchX,
  Settings,
  Shapes,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Shirt,
  Skull,
  Sliders,
  SlidersHorizontal,
  Smile,
  Sparkle,
  Sparkles,
  Split,
  Square,
  Star,
  Sun,
  Sword,
  Swords,
  Tag,
  Tags,
  Target,
  Terminal,
  TextCursorInput,
  TrendingUp,
  TrendingDown,
  Trash2,
  TriangleAlert,
  Trophy,
  Type,
  Undo2,
  Redo2,
  Unlock,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  VenetianMask,
  Wand2,
  Wind,
  X,
  XCircle,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide';

// Icono canónico personalizado oficial de Steam (24x24)
export const Steam = [
  ['path', {
    d: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.704L.488 15.01C1.936 20.217 6.643 24 12.228 24c6.627 0 12-5.373 12-12S18.855 0 11.979 0zM8.541 17.502a1.867 1.867 0 0 1-1.86 1.869c-1.032 0-1.87-.837-1.87-1.869 0-.58.267-1.1.686-1.444l2.457 1.014c.376.155.587.27.587.43zm7.404-6.327c-1.246 0-2.262-1.015-2.262-2.262 0-1.246 1.016-2.261 2.262-2.261 1.246 0 2.261 1.015 2.261 2.261 0 1.247-1.015 2.262-2.261 2.262z',
    fill: 'currentColor',
    stroke: 'none'
  }]
];

export const appIcons = {
  Activity,
  AlignCenter,
  AlignLeft,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Anchor,
  Archive,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpToLine,
  Award,
  BadgeX,
  Ban,
  Binary,
  BarChart3,
  BatteryCharging,
  Bold,
  Bomb,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  Boxes,
  Brain,
  BrainCircuit,
  Briefcase,
  Camera,
  Check,
  CheckCheck,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Circle,
  CircleSlash,
  CircleSlashed,
  Clapperboard,
  Clipboard,
  ClipboardList,
  Clock,
  Clover,
  Code2,
  Coffee,
  Coins,
  Compass,
  Contact,
  Copy,
  CopyCheck,
  CopyPlus,
  Cpu,
  Crop,
  Crosshair,
  Crown,
  Database,
  Dice5,
  Dna,
  Download,
  DownloadCloud,
  Droplet,
  DropletOff,
  Dumbbell,
  Edit2,
  Edit3,
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  FileCheck2,
  FileSearch,
  FileText,
  FileX,
  Film,
  Filter,
  Flag,
  Flame,
  FlipHorizontal,
  FlipVertical,
  Folder,
  FolderArchive,
  FolderKanban,
  FolderMinus,
  FolderOpen,
  FolderOutput,
  FolderPlus,
  Folders,
  FolderUp,
  Footprints,
  Frown,
  Gamepad2,
  Gauge,
  Gem,
  Ghost,
  GitFork,
  GitCommit,
  GitCompare,
  GitMerge,
  Glasses,
  Globe,
  Grid,
  GripVertical,
  Hand,
  HardDrive,
  Hash,
  Heading,
  Heart,
  HeartHandshake,
  HeartPulse,
  HelpCircle,
  History,
  Hourglass,
  IdCard,
  Image,
  ImageOff,
  ImagePlus,
  ImageUp,
  Images,
  Info,
  Keyboard,
  Lamp,
  Languages,
  Layers,
  Layout,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Link,
  ListChecks,
  ListFilter,
  ListTodo,
  Loader2,
  Lock,
  MapPin,
  Maximize2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Mic,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  Move,
  MoveHorizontal,
  'move-horizontal': MoveHorizontal,
  MoveVertical,
  Music,
  Network,
  Package,
  PackageOpen,
  Palette,
  PauseCircle,
  PawPrint,
  PenLine,
  Pencil,
  Pipette,
  Plus,
  PlusCircle,
  Printer,
  Puzzle,
  Quote,
  Ratio,
  Recycle,
  RefreshCw,
  Repeat,
  RotateCcw,
  RotateCw,
  Rows3,
  Ruler,
  Save,
  Scale,
  Scan,
  ScanFace,
  Scissors,
  ScrollText,
  Search,
  SearchX,
  Settings,
  Shapes,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Shirt,
  Skull,
  Sliders,
  SlidersHorizontal,
  Smile,
  Sparkle,
  Sparkles,
  Split,
  Square,
  Star,
  Sun,
  Sword,
  Swords,
  Tag,
  Tags,
  Target,
  Terminal,
  TextCursorInput,
  TrendingUp,
  TrendingDown,
  Trash2,
  TriangleAlert,
  Trophy,
  Type,
  Unlock,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Utensils,
  VenetianMask,
  Wand2,
  Wind,
  X,
  XCircle,
  Zap,
  ZoomIn,
  ZoomOut,

  // Custom Steam
  Steam,
  steam: Steam,

  // Aliases frecuentes para compatibilidad
  'align-center': AlignCenter,
  'align-left': AlignLeft,
  'circle-slashed': CircleSlash,
  'circle-slash': CircleSlash,
  'aspect-ratio': Ratio,
  'AspectRatio': Ratio,
  'folder-kanban': FolderKanban,
  'folder-archive': FolderArchive,
  'folder-output': FolderOutput,
  'folders': Folders,
  'folder-up': FolderUp,
  'folder-minus': FolderMinus,
  'undo-2': Undo2,
  'redo-2': Redo2,
  'arrow-up-down': ArrowUpDown,
  'arrow-up-to-line': ArrowUpToLine,
  'arrow-down': ArrowDown,
  'arrow-down-to-line': ArrowDownToLine,
  'arrow-down-a-z': ArrowDownAZ,
  'hard-drive': HardDrive,
  'film': Film,
  'eraser': Eraser,
  'git-commit': GitCommit,
  'git-compare': GitCompare,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'arrow-left-right': ArrowLeftRight,
  'edit-2': Edit2
};

const defaultAttrs = {
  'stroke-width': 1.25,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
};

const toPascalCase = (str) =>
  String(str).replace(/(\w)(\w*)(_|-|\s*)/g, (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase());

function getAttrs(element) {
  const attrs = {};
  if (!element || !element.attributes) return attrs;
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

function getClassNames(element, iconName, extraClass) {
  const classes = ['lucide', `lucide-${iconName}`];
  const orig = element.getAttribute('class');
  if (orig) {
    classes.push(...orig.split(/\s+/).filter(Boolean));
  }
  if (extraClass) {
    classes.push(...extraClass.split(/\s+/).filter(Boolean));
  }
  return Array.from(new Set(classes)).join(' ');
}

export function createIconSvgElement(iconName, customAttrs = {}) {
  if (!iconName || typeof document === 'undefined') return null;
  const compName = toPascalCase(iconName);
  const iconNode = appIcons[compName] || appIcons[iconName] || appIcons[iconName.toLowerCase()];
  if (!iconNode) return null;

  const extraClass = customAttrs.class ? String(customAttrs.class).split(/\s+/).filter(Boolean) : [];
  const mergedAttrs = {
    ...defaultAttrs,
    ...customAttrs,
    class: Array.from(new Set(['lucide', `lucide-${iconName}`, ...extraClass])).join(' ')
  };
  return createElement(iconNode, mergedAttrs);
}

function renderSingleIcon(element, iconName, customAttrs = {}) {
  if (!element || !element.parentNode) return null;
  const compName = toPascalCase(iconName);
  const iconNode = appIcons[compName] || appIcons[iconName] || appIcons[iconName.toLowerCase()];
  if (!iconNode) {
    return null;
  }

  const origAttrs = getAttrs(element);
  const mergedAttrs = {
    ...defaultAttrs,
    ...customAttrs,
    ...origAttrs,
    'data-lucide': iconName,
    'data-lucide-rendered': iconName,
    class: getClassNames(element, iconName, customAttrs.class)
  };

  const svgElement = createElement(iconNode, mergedAttrs);
  element.parentNode.replaceChild(svgElement, element);
  return svgElement;
}

/**
 * Renderiza de forma selectiva, diferencial y no destructiva los íconos Lucide.
 * - Soporta la opción { root: Element } para renderizar subárboles (ej. TierList).
 * - Omite inmediatamente cualquier SVG ya renderizado con el mismo ícono (0ms layout thrashing).
 * - Actualiza quirúrgicamente solo elementos cuyos atributos hayan cambiado o sean nuevos.
 */
export function createIcons(options = {}) {
  if (typeof document === 'undefined') return [];
  const root = options.root || document;
  const nameAttr = options.nameAttr || 'data-lucide';
  const renderedAttr = `${nameAttr}-rendered`;
  const customAttrs = {
    ...defaultAttrs,
    ...(options.attrs || {})
  };

  // Solo buscar elementos que aún NO han sido renderizados como SVG (evita iterar sobre cientos de SVGs existentes)
  const selector = `[${nameAttr}]:not([${renderedAttr}])`;
  const candidates = Array.from(root.querySelectorAll(selector));
  if (root !== document && root.nodeType === 1 && root.hasAttribute(nameAttr) && !root.hasAttribute(renderedAttr)) {
    candidates.unshift(root);
  }
  if (!candidates || candidates.length === 0) return [];

  const created = [];
  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    const iconName = el.getAttribute(nameAttr);
    if (!iconName) continue;

    // Si ya es un SVG renderizado con ese mismo icono, saltar sin tocar el DOM
    if (el.getAttribute(renderedAttr) === iconName) {
      continue;
    }

    const res = renderSingleIcon(el, iconName, customAttrs);
    if (res) created.push(res);
  }

  return created;
}

let _iconRafId = null;
let _iconObserver = null;

/**
 * Renderiza de forma segura todos los elementos [data-lucide] pendientes en el DOM.
 * Si no hay íconos pendientes, no realiza ningún cómputo innecesario.
 * @param {ParentNode} [root=document]
 */
export function renderIcons(root = document) {
  if (typeof document === 'undefined') return;
  try {
    createIcons({ root });
  } catch (e) {
    console.warn('[lucide] Error rendering icons:', e);
  }
}

/**
 * Inicializa un único MutationObserver global con requestAnimationFrame
 * para renderizar automáticamente cualquier ícono Lucide insertado dinámicamente
 * (cambios de pestañas, apertura de modales, listas reactivas de Alpine.js)
 * eliminando por completo la necesidad de múltiples setTimeout() dispersos.
 *
 * Filtra los SVGs generados internamente para evitar bucles reactivos y layout thrashing.
 */
export function initIconObserver() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  if (_iconObserver) return; // Evitar inicializaciones duplicadas

  // Render inicial de arranque
  renderIcons();

  _iconObserver = new MutationObserver((mutations) => {
    let hasPending = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'childList') {
        const added = m.addedNodes;
        if (!added || added.length === 0) continue;
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType === 1) { // Node.ELEMENT_NODE
            // Ignorar los SVGs que este mismo motor acaba de inyectar
            if (node.hasAttribute('data-lucide-rendered')) {
              continue;
            }
            if (node.hasAttribute('data-lucide')) {
              hasPending = true;
              break;
            }
            // Optimización crítica: solo buscar en profundidad si el nodo tiene elementos hijos
            if (node.firstElementChild && node.querySelector('[data-lucide]:not([data-lucide-rendered])')) {
              hasPending = true;
              break;
            }
          }
        }
      } else if (m.type === 'attributes' && m.attributeName === 'data-lucide') {
        const el = m.target;
        if (el.getAttribute('data-lucide') !== el.getAttribute('data-lucide-rendered')) {
          el.removeAttribute('data-lucide-rendered');
          hasPending = true;
        }
      }
      if (hasPending) break;
    }

    if (!hasPending) return;

    // Debounce con requestAnimationFrame para procesar todas las mutaciones en un único frame
    if (_iconRafId) cancelAnimationFrame(_iconRafId);
    _iconRafId = requestAnimationFrame(() => {
      _iconRafId = null;
      renderIcons();
    });
  });

  _iconObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-lucide']
  });
}
