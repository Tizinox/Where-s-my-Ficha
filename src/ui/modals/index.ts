/**
 * @file src/ui/modals/index.ts
 * Compositor central de los modales y diálogos globales del sistema.
 */

import { renderModalCreateSheet } from './modalCreateSheet';
import { renderModalSheetConverter } from './modalSheetConverter';
import { renderModalDashboard } from './modalDashboard';
import { renderModalDiscord } from './modalDiscord';
import { renderModalCropper } from './modalCropper';
import { renderModalMultiImagePicker } from './modalMultiImagePicker';
import { renderModalMediaNotices } from './modalMediaNotices';
import { renderModalThemeDesigner } from './modalThemeDesigner';
import { renderModalDevConsole } from './modalDevConsole';
import { renderModalHotkeys } from './modalHotkeys';
import { renderModalFactoryReset } from './modalFactoryReset';
import { renderModalFolders } from './modalFolders';
import { renderModalSteamCosmetics } from './modalSteamCosmetics';
import { renderModalEmojiPicker } from './modalEmojiPicker';
import { renderModalSteamEmojis } from './modalSteamEmojis';
import { renderModalJsonPreview } from './modalJsonPreview';
import { renderModalCreateCustomTab } from './modalCreateCustomTab';
import { renderModalCustomBlock } from './modalCustomBlock';

const GLOBAL_MODAL_RENDERERS = [
  renderModalCreateSheet,
  renderModalSheetConverter,
  renderModalDashboard,
  renderModalDiscord,
  renderModalCropper,
  renderModalMultiImagePicker,
  renderModalMediaNotices,
  renderModalThemeDesigner,
  renderModalDevConsole,
  renderModalHotkeys,
  renderModalFactoryReset,
  renderModalFolders,
  renderModalSteamCosmetics,
  renderModalEmojiPicker,
  renderModalSteamEmojis,
  renderModalJsonPreview,
  renderModalCreateCustomTab,
  renderModalCustomBlock,
] as const;

export function renderGlobalModals(): string {
  return GLOBAL_MODAL_RENDERERS.map((renderModal) => renderModal()).join('\n');
}

