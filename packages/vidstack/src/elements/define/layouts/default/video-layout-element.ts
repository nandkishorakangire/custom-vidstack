import { effect } from 'maverick.js';
import { Host, type Attributes } from 'maverick.js/element';

import { useDefaultLayoutContext } from '../../../../components/layouts/default/context';
import type { DefaultLayoutProps } from '../../../../components/layouts/default/props';
import { DefaultVideoLayout } from '../../../../components/layouts/default/video-layout';
import { useMediaContext, type MediaContext } from '../../../../core/api/media-context';
import { $signal } from '../../../lit/directives/signal';
import { LitElement, type LitRenderer } from '../../../lit/lit-element';
import { setLayoutName } from '../layout-name';
import { SlotManager } from '../slot-manager';
import { DefaultLayoutIconsLoader } from './icons-loader';
import { createMenuContainer } from './ui/menu/menu-portal';
import {
  DefaultBufferingIndicator,
  DefaultVideoLayoutLarge,
  DefaultVideoLayoutSmall,
  DefaultVideoLoadLayout,
} from './video-layout';

/**
 * @docs {@link https://www.vidstack.io/docs/wc/player/components/layouts/default-layout}
 * @example
 * ```html
 * <media-player>
 *   <media-provider></media-provider>
 *   <media-video-layout></media-video-layout>
 * </media-player>
 * ```
 */
export class MediaVideoLayoutElement
  extends Host(LitElement, DefaultVideoLayout)
  implements LitRenderer
{
  static tagName = 'media-video-layout';

  static override attrs: Attributes<DefaultLayoutProps> = {
    smallWhen: {
      converter(value) {
        return value !== 'never' && !!value;
      },
    },
  };

  private _media!: MediaContext;

  protected onSetup() {
    // Avoid memory leaks if `keepAlive` is true. The DOM will re-render regardless.
    this.forwardKeepAlive = false;

    this._media = useMediaContext();

    this.classList.add('vds-video-layout');
  }

  protected onConnect() {
    setLayoutName('video', () => this.isMatch);
    this._setupMenuContainer();
  }

  render() {
    return $signal(this._render.bind(this));
  }

  private _setupMenuContainer() {
    const { menuPortal } = useDefaultLayoutContext();

    effect(() => {
      if (!this.isMatch) return;

      const container = createMenuContainer(
          this.menuContainer,
          'vds-video-layout',
          () => this.isSmallLayout,
        ),
        roots = container ? [this, container] : [this];

      const iconsManager = this.$props.customIcons()
        ? new SlotManager(roots)
        : new DefaultLayoutIconsLoader(roots);

      iconsManager.connect();

      menuPortal.set(container);

      return () => {
        container.remove();
        menuPortal.set(null);
      };
    });
  }

  private _render() {
    const { load } = this._media.$props,
      { canLoad, streamType, nativeControls } = this._media.$state;

    return !nativeControls() && this.isMatch
      ? load() === 'play' && !canLoad()
        ? DefaultVideoLoadLayout()
        : streamType() === 'unknown'
          ? DefaultBufferingIndicator()
          : this.isSmallLayout
            ? DefaultVideoLayoutSmall()
            : DefaultVideoLayoutLarge()
      : null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'media-video-layout': MediaVideoLayoutElement;
  }
}
