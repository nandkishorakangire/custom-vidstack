import * as React from 'react';

import { useSignal, useSignalRecord, useStateContext } from 'maverick.js/react';
import { sliderState, type SliderState } from 'vidstack';

import {
  SliderInstance,
  type TimeSliderInstance,
  type VolumeSliderInstance,
} from '../components/primitives/instances';

const sliderStateRecord = SliderInstance.state.record,
  initialSliderStore = Object.keys(sliderStateRecord).reduce(
    (store, prop) => ({
      ...store,
      [prop]() {
        return sliderStateRecord[prop];
      },
    }),
    {},
  );

/**
 * This hook is used to subscribe to a specific slider state.
 *
 * @docs {@link https://www.vidstack.io/docs/player/api/hooks/use-slider-state}
 */
export function useSliderState<T extends keyof SliderState>(
  prop: T,
  ref?: React.RefObject<SliderInstance | VolumeSliderInstance | TimeSliderInstance | null>,
): SliderState[T] {
  const $state = useStateContext(sliderState);

  if (__DEV__ && !$state && !ref) {
    console.warn(
      `[vidstack] \`useSliderState\` requires \`RefObject<SliderInstance>\` argument if called` +
        ' outside of a slider component',
    );
  }

  return useSignal((ref?.current?.$state || $state || initialSliderStore)[prop]);
}

/**
 * This hook is used to subscribe to the current slider state on the given or nearest slider
 * component.
 *
 * @docs {@link https://www.vidstack.io/docs/player/api/hooks/use-slider-state#store}
 */
export function useSliderStore(
  ref?: React.RefObject<SliderInstance | VolumeSliderInstance | TimeSliderInstance | null>,
): Readonly<SliderState> {
  const $state = useStateContext(sliderState);

  if (__DEV__ && !$state && !ref) {
    console.warn(
      `[vidstack] \`useSliderStore\` requires \`RefObject<SliderInstance>\` argument if called` +
        ' outside of a slider component',
    );
  }

  return useSignalRecord(ref?.current ? ref.current.$state : $state || initialSliderStore);
}
