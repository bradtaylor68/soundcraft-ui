import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { OperatorFunction, pipe } from 'rxjs';

import { ChannelType, BusType, PlayerState } from '../types';
import { MixerState } from './mixer-state.models';
import { getObjectPath } from '../utils/object-path';

type Projector<T> = (state: MixerState) => T;
type Selector<T> = (...args: any[]) => Projector<T>;

/**
 * RxJS operator to apply a custom projecton to the full mixer state.
 * @param projector Projector function generated by a selector
 */
export const select = <T>(projector: Projector<T>): OperatorFunction<MixerState, T> =>
  pipe(
    map(state => projector(state)),
    distinctUntilChanged(),
    filter(e => e !== undefined)
  );

/**
 * Internal helper function to select parts of the nested state object
 * @param state The full mixer state
 * @param path The path to select from the nested object, segment by segment
 */
function getStatePath<T>(state: MixerState, path: (string | number)[], defaultValue = undefined) {
  return getObjectPath<T>(state, path, defaultValue);
}

/**************************** */

/**
 * Internal helper function to select a property from a channel.
 * Differentiates between master and aux/fx bus
 * @param property The property to select
 * @param channelType
 * @param channel
 * @param busType
 * @param bus
 */
const selectGenericChannelProperty: Selector<number> = (
  property: string,
  defaultValue = undefined,
  channelType: ChannelType,
  channel: number,
  busType: BusType,
  bus?: number
) => {
  return state => {
    switch (busType) {
      case 'master':
        return getStatePath<number>(state, [channelType, channel - 1, property], defaultValue);
      case 'aux':
      case 'fx':
        return getStatePath<number>(
          state,
          [channelType, channel - 1, busType, bus - 1, property],
          defaultValue
        );
    }
  };
};

/**
 * Select level value of the master fader
 */
export const selectMasterValue: Selector<number> = () => state =>
  getStatePath<number>(state, ['m', 'mix']);

/**
 * Select pan value of the master fader
 */
export const selectMasterPan: Selector<number> = () => state =>
  getStatePath<number>(state, ['m', 'pan']);

/**
 * Select dim value of the master fader
 */
export const selectMasterDim: Selector<number> = () => state =>
  getStatePath<number>(state, ['m', 'dim']);

/**
 * Select pan value of a channel
 * @param channelType Type of the channel
 * @param channel Channel number
 * @param busType Type of the bus
 * @param bus bus number
 */
export const selectPan: Selector<number> = (
  channelType: ChannelType,
  channel: number,
  busType: BusType,
  bus?: number
) => selectGenericChannelProperty('pan', 0, channelType, channel, busType, bus);

/**
 * Select mute value of a channel
 * @param channelType
 * @param channel
 * @param busType
 * @param bus
 */
export const selectMute: Selector<number> = (
  channelType: ChannelType,
  channel: number,
  busType: BusType,
  bus?: number
) => selectGenericChannelProperty('mute', 0, channelType, channel, busType, bus);

/**
 * Select solo value of a channel
 * @param channelType
 * @param channel
 */
export const selectSolo: Selector<number> = (channelType: ChannelType, channel: number) => {
  return state => getStatePath<number>(state, [channelType, channel - 1, 'solo']);
};

/**
 * Select fader value of a channel
 * @param channelType
 * @param channel
 * @param busType
 * @param bus
 */
export const selectFaderValue: Selector<number> = (
  channelType: ChannelType,
  channel: number,
  busType: BusType,
  bus?: number
) => {
  return state => {
    switch (busType) {
      case 'master':
        return getStatePath<number>(state, [channelType, channel - 1, 'mix']);
      case 'aux':
      case 'fx':
        return getStatePath<number>(state, [channelType, channel - 1, busType, bus - 1, 'value']);
    }
  };
};

/**
 * Select "post" value of a send channel
 * @param channelType
 * @param channel
 */
export const selectPost: Selector<number> = (
  channelType: ChannelType,
  channel: number,
  busType: BusType,
  bus: number
) => {
  return state =>
    getStatePath<number>(state, [channelType, channel - 1, busType, bus - 1, 'post'], 0);
};

/**
 * Select "postproc" value of a send channel
 * @param channelType
 * @param channel
 */
export const selectAuxPostProc: Selector<number> = (
  channelType: ChannelType,
  channel: number,
  aux: number
) => {
  return state =>
    getStatePath<number>(state, [channelType, channel - 1, 'aux', aux - 1, 'postproc'], 0);
};

/**
 * Select stereo index of a channel.
 * This will be -1 when no stereo link is active, 0 when the channel is left in the link, 1 if it's right
 * @param channelType
 * @param channel
 */
export const selectStereoIndex: Selector<number> = (channelType: ChannelType, channel: number) => {
  return state => {
    // only input, line, player and aux can be linked
    if (['i', 'l', 'p', 'a'].includes(channelType)) {
      return getStatePath<number>(state, [channelType, channel - 1, 'stereoIndex'], -1);
    }
    return -1;
  };
};

/**
 * Select phantom power state of a hardware channel
 * @param channel
 */
export const selectPhantom: Selector<number> = (channel: number) => {
  return state => getStatePath<number>(state, ['hw', channel - 1, 'phantom']);
};

/** Select player state */
export const selectPlayerState: Selector<PlayerState> = () => {
  return state => getStatePath<PlayerState>(state, ['var', 'currentState'], PlayerState.Stopped);
};

/** Select player current length */
export const selectPlayerLength: Selector<number> = () => {
  return state => getStatePath<number>(state, ['var', 'currentLength'], -1);
};

/** Select player current position */
export const selectPlayerCurrentTrackPos: Selector<number> = () => {
  return state => getStatePath<number>(state, ['var', 'currentTrackPos'], 0);
};

/** Select player elapsed time */
export const selectPlayerElapsedTime: Selector<number> = () => {
  return state => {
    const pos = selectPlayerCurrentTrackPos()(state);
    const length = selectPlayerLength()(state);
    return Math.max(0, Math.floor(pos * length));
  };
};

/** Select player remaining time */
export const selectPlayerRemainingTime: Selector<number> = () => {
  return state => {
    const elapsed = selectPlayerElapsedTime()(state);
    const length = selectPlayerLength()(state);
    return Math.max(0, Math.floor(length - elapsed));
  };
};

/** Select player current playlist */
export const selectPlayerPlaylist: Selector<string> = () => {
  return state => getStatePath<string>(state, ['var', 'currentPlaylist']);
};

/** Select player current track */
export const selectPlayerTrack: Selector<string> = () => {
  return state => getStatePath<string>(state, ['var', 'currentTrack']);
};

/** Select player shuffle setting */
export const selectPlayerShuffle: Selector<number> = () => {
  return state => getStatePath<number>(state, ['settings', 'shuffle'], 0);
};

/** Select recording state (2-track) */
export const selectRecordingState: Selector<number> = () => {
  return state => getStatePath<number>(state, ['var', 'isRecording'], 0);
};

/** Select recording busy state (2-track) */
export const selectRecordingBusyState: Selector<number> = () => {
  return state => getStatePath<number>(state, ['var', 'recBusy'], 0);
};

/** Select mute group bit mask */
export const selectMuteGroupMask: Selector<number> = () => {
  return state => getStatePath<number>(state, ['mgmask']);
};

/**
 * Select fader value of a volume bus (headphones or solo)
 * @param busName Name of the bus in the "settings" part of the state
 * @param busId Optional ID of the bus
 */
export const selectVolumeBusValue: Selector<number> = (busName: string, busId?: number) => state =>
  getStatePath<number>(state, ['settings', busName, ...(busId >= 0 ? [busId] : [])]);
