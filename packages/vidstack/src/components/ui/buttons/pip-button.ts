import { Component } from 'maverick.js';

import { useMediaContext, type MediaContext } from '../../../core/api/media-context';
import type { MediaRequestEvents } from '../../../core/api/media-request-events';
import { $ariaBool } from '../../../utils/aria';
import { setARIALabel } from '../../../utils/dom';
import {
  ToggleButtonController,
  type ToggleButtonControllerProps,
} from './toggle-button-controller';

export interface PIPButtonProps extends ToggleButtonControllerProps {}

export interface PIPButtonEvents
  extends Pick<MediaRequestEvents, 'media-enter-pip-request' | 'media-exit-pip-request'> {}

/**
 * A button for toggling the picture-in-picture (PIP) mode of the player.
 *
 * @attr data-active - Whether picture-in-picture mode is active.
 * @attr data-supported - Whether picture-in-picture mode is available.
 * @docs {@link https://www.vidstack.io/docs/player/components/buttons/pip-button}
 * @see {@link https://www.vidstack.io/docs/player/api/picture-in-picture}
 */
export class PIPButton extends Component<PIPButtonProps, {}, PIPButtonEvents> {
  static props: PIPButtonProps = ToggleButtonController.props;

  private _media!: MediaContext;

  constructor() {
    super();
    new ToggleButtonController({
      _isPressed: this._isPressed.bind(this),
      _keyShortcut: 'togglePictureInPicture',
      _onPress: this._onPress.bind(this),
    });
  }

  protected override onSetup(): void {
    this._media = useMediaContext();

    const { pictureInPicture } = this._media.$state,
      isSupported = this._isSupported.bind(this);

    this.setAttributes({
      'data-active': pictureInPicture,
      'data-supported': isSupported,
      'aria-hidden': $ariaBool(() => !isSupported()),
    });
  }

  protected override onAttach(el: HTMLElement): void {
    el.setAttribute('data-media-tooltip', 'pip');
    setARIALabel(el, 'PiP');
  }

  private _onPress(event: Event) {
    const remote = this._media.remote;
    this._isPressed() ? remote.exitPictureInPicture(event) : remote.enterPictureInPicture(event);
  }

  private _isPressed() {
    const { pictureInPicture } = this._media.$state;
    return pictureInPicture();
  }

  private _isSupported() {
    const { canPictureInPicture } = this._media.$state;
    return canPictureInPicture();
  }
}
