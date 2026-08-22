import { playDeleteSound } from '@/utils/uiSound'
import { showToast } from '@/utils/toast'
import { i18n } from '@/i18n'

/** Звук + спливаюче «Видалено» (або кастомне повідомлення). */
export function notifyDeleted(messageKey = 'common.deleted') {
  void playDeleteSound()
  const msg = i18n.global.t(messageKey)
  showToast(typeof msg === 'string' ? msg : String(msg))
}
