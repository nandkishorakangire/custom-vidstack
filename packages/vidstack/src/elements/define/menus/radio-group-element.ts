import { Host } from 'maverick.js/element';

import { RadioGroup } from '../../../components/ui/menu/radio/radio-group';

/**
 * @docs {@link https://www.vidstack.io/docs/wc/player/components/menu/radio-group}
 * @example
 * ```html
 * <media-radio-group value="720">
 *   <media-radio value="1080">1080p</media-radio>
 *   <media-radio value="720">720p</media-radio>
 *   <!-- ... -->
 * </media-radio-group>
 * ```
 */
export class MediaRadioGroupElement extends Host(HTMLElement, RadioGroup) {
  static tagName = 'media-radio-group';
}

declare global {
  interface HTMLElementTagNameMap {
    'media-radio-group': MediaRadioGroupElement;
  }
}
