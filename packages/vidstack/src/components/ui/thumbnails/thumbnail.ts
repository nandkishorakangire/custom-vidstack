import { Component, effect, State } from 'maverick.js';
import { isNull, listenEvent } from 'maverick.js/std';

import { useMediaContext, type MediaContext } from '../../../core/api/media-context';
import type { MediaCrossOrigin } from '../../../core/api/types';
import { $ariaBool } from '../../../utils/aria';
import { ThumbnailsLoader, type ThumbnailImage, type ThumbnailSrc } from './thumbnail-loader';

/**
 * Used to load and display a preview thumbnail at the given `time`.
 *
 * @attr data-loading - Whether thumbnail image is loading.
 * @attr data-error - Whether an error occurred loading thumbnail.
 * @attr data-hidden - Whether thumbnail is not available or failed to load.
 * @docs {@link https://www.vidstack.io/docs/player/components/display/thumbnail}
 */
export class Thumbnail extends Component<ThumbnailProps, ThumbnailState> {
  static props: ThumbnailProps = {
    src: null,
    time: 0,
    crossOrigin: null,
  };

  static state = new State<ThumbnailState>({
    src: '',
    img: null,
    thumbnails: [],
    activeThumbnail: null,
    crossOrigin: null,
    loading: false,
    error: null,
    hidden: false,
  });

  protected _media!: MediaContext;
  protected _loader!: ThumbnailsLoader;

  private _styleResets: (() => void)[] = [];

  protected override onSetup(): void {
    this._media = useMediaContext();
    this._loader = ThumbnailsLoader.create(this.$props.src, this.$state.crossOrigin);

    this._watchCrossOrigin();

    this.setAttributes({
      'data-loading': this._isLoading.bind(this),
      'data-error': this._hasError.bind(this),
      'data-hidden': this.$state.hidden,
      'aria-hidden': $ariaBool(this.$state.hidden),
    });
  }

  protected override onConnect(el: HTMLElement) {
    effect(this._watchImg.bind(this));
    effect(this._watchHidden.bind(this));
    effect(this._watchCrossOrigin.bind(this));
    effect(this._onLoadStart.bind(this));
    effect(this._onFindActiveThumbnail.bind(this));
    effect(this._resize.bind(this));
  }

  private _watchImg() {
    const img = this.$state.img();
    if (!img) return;
    listenEvent(img, 'load', this._onLoaded.bind(this));
    listenEvent(img, 'error', this._onError.bind(this));
  }

  private _watchCrossOrigin() {
    const { crossOrigin: crossOriginProp } = this.$props,
      { crossOrigin: crossOriginState } = this.$state,
      { crossOrigin: mediaCrossOrigin } = this._media.$state,
      crossOrigin = crossOriginProp() !== null ? crossOriginProp() : mediaCrossOrigin();
    crossOriginState.set(crossOrigin === true ? 'anonymous' : crossOrigin);
  }

  private _onLoadStart() {
    const { src, loading, error } = this.$state;

    if (src()) {
      loading.set(true);
      error.set(null);
    }

    return () => {
      this._resetStyles();
      loading.set(false);
      error.set(null);
    };
  }

  private _onLoaded() {
    const { loading, error } = this.$state;
    this._resize();
    loading.set(false);
    error.set(null);
  }

  private _onError(event: ErrorEvent) {
    const { loading, error } = this.$state;
    loading.set(false);
    error.set(event);
  }

  private _isLoading() {
    const { loading, hidden } = this.$state;
    return !hidden() && loading();
  }

  private _hasError() {
    const { error } = this.$state;
    return !isNull(error());
  }

  private _watchHidden() {
    const { hidden } = this.$state,
      { duration } = this._media.$state,
      images = this._loader.$images();
    hidden.set(this._hasError() || !Number.isFinite(duration()) || images.length === 0);
  }

  protected _getTime() {
    return this.$props.time();
  }

  private _onFindActiveThumbnail() {
    let images = this._loader.$images();
    if (!images.length) return;

    let time = this._getTime(),
      { src, activeThumbnail } = this.$state,
      activeIndex = -1,
      activeImage: ThumbnailImage | null = null;

    for (let i = images.length - 1; i >= 0; i--) {
      const image = images[i];
      if (time >= image.startTime && (!image.endTime || time < image.endTime)) {
        activeIndex = i;
        break;
      }
    }

    if (images[activeIndex]) {
      activeImage = images[activeIndex];
    }

    activeThumbnail.set(activeImage);
    src.set(activeImage?.url.href || '');
  }

  private _resize() {
    if (!this.scope || this.$state.hidden()) return;

    const rootEl = this.el,
      imgEl = this.$state.img(),
      thumbnail = this.$state.activeThumbnail();

    if (!imgEl || !thumbnail || !rootEl) return;

    let width = thumbnail.width ?? imgEl.naturalWidth,
      height = thumbnail?.height ?? imgEl.naturalHeight,
      {
        maxWidth,
        maxHeight,
        minWidth,
        minHeight,
        width: elWidth,
        height: elHeight,
      } = getComputedStyle(this.el);

    if (minWidth === '100%') minWidth = parseFloat(elWidth) + '';
    if (minHeight === '100%') minHeight = parseFloat(elHeight) + '';

    let minRatio = Math.max(parseInt(minWidth) / width, parseInt(minHeight) / height),
      maxRatio = Math.min(
        Math.max(parseInt(minWidth), parseInt(maxWidth)) / width,
        Math.max(parseInt(minHeight), parseInt(maxHeight)) / height,
      ),
      scale = !isNaN(maxRatio) && maxRatio < 1 ? maxRatio : minRatio > 1 ? minRatio : 1;

    this._style(rootEl, '--thumbnail-width', `${width * scale}px`);
    this._style(rootEl, '--thumbnail-height', `${height * scale}px`);
    this._style(imgEl, 'width', `${imgEl.naturalWidth * scale}px`);
    this._style(imgEl, 'height', `${imgEl.naturalHeight * scale}px`);
    this._style(
      imgEl,
      'transform',
      thumbnail.coords
        ? `translate(-${thumbnail.coords.x * scale}px, -${thumbnail.coords.y * scale}px)`
        : '',
    );
    this._style(imgEl, 'max-width', 'none');
  }

  private _style(el: HTMLElement, name: string, value: string) {
    el.style.setProperty(name, value);
    this._styleResets.push(() => el.style.removeProperty(name));
  }

  private _resetStyles() {
    for (const reset of this._styleResets) reset();
    this._styleResets = [];
  }
}

export interface ThumbnailProps {
  /**
   * The thumbnails resource.
   *
   * @see {@link https://www.vidstack.io/docs/player/core-concepts/loading#thumbnails}
   */
  src: ThumbnailSrc;
  /**
   * Finds, loads, and displays the first active thumbnail cue that's start/end times are in range.
   */
  time: number;
  /**
   * Defines how the media handles cross-origin requests, thereby enabling the
   * configuration of the CORS requests for the element's fetched data.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin}
   */
  crossOrigin: true | MediaCrossOrigin | null;
}

export interface ThumbnailState {
  src: string;
  img: HTMLImageElement | null | undefined;
  crossOrigin: MediaCrossOrigin | null;
  thumbnails: ThumbnailImage[];
  activeThumbnail: ThumbnailImage | null;
  loading: boolean;
  error: ErrorEvent | null;
  hidden: boolean;
}
