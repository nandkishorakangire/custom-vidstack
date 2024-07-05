import { effect } from 'maverick.js';
import { Host, type Attributes } from 'maverick.js/element';
import { setAttribute } from 'maverick.js/std';

import { Thumbnail, type ThumbnailProps } from '../../components/ui/thumbnails/thumbnail';
import { useMediaContext, type MediaContext } from '../../core/api/media-context';
import { cloneTemplateContent, createTemplate } from '../../utils/dom';

const imgTemplate = /* #__PURE__*/ createTemplate(
  '<img loading="eager" decoding="async" aria-hidden="true">',
);

/**
 * @docs {@link https://www.vidstack.io/docs/wc/player/components/display/thumbnail}
 * @example
 * ```html
 * <media-player>
 *   <!-- ... -->
 *   <media-thumbnail
 *     src="https://files.vidstack.io/thumbnails.vtt"
 *     time="10"
 *   ></media-thumbnail>
 * </media-player>
 * ```
 */
export class MediaThumbnailElement extends Host(HTMLElement, Thumbnail) {
  static tagName = 'media-thumbnail';

  static override attrs: Attributes<ThumbnailProps> = {
    crossOrigin: 'crossorigin',
  };

  protected _media!: MediaContext;
  protected _img = this._createImg();

  protected onSetup(): void {
    this._media = useMediaContext();
    this.$state.img.set(this._img);
  }

  protected onConnect(): void {
    const { src, crossOrigin } = this.$state;

    if (this._img.parentNode !== this) {
      this.prepend(this._img);
    }

    effect(() => {
      setAttribute(this._img, 'src', src());
      setAttribute(this._img, 'crossorigin', crossOrigin());
    });
  }

  private _createImg() {
    return cloneTemplateContent<HTMLImageElement>(imgTemplate);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'media-thumbnail': MediaThumbnailElement;
  }
}
