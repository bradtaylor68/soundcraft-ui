import { SoundcraftUI } from '../soundcraft-ui';
import { readFirst } from '../utils/testing-utils';
import { MuteGroup } from './mute-group';

describe('Mute Group', () => {
  let conn: SoundcraftUI;
  let group: MuteGroup;

  beforeEach(() => {
    conn = new SoundcraftUI('0.0.0.0');
    conn.conn.sendMessage('SETD^mgmask^0'); // reset
  });

  describe('numeric', () => {
    beforeEach(() => (group = conn.muteGroup(2)));

    it('state$', async () => {
      group.mute();
      expect(await readFirst(group.state$)).toBe(1);

      group.unmute();
      expect(await readFirst(group.state$)).toBe(0);
    });

    it('toggle', async () => {
      group.toggle();
      expect(await readFirst(group.state$)).toBe(1);

      group.toggle();
      expect(await readFirst(group.state$)).toBe(0);
    });
  });

  describe('all', () => {
    beforeEach(() => (group = conn.muteGroup('all')));

    it('state$', async () => {
      group.mute();
      expect(await readFirst(group.state$)).toBe(1);

      group.unmute();
      expect(await readFirst(group.state$)).toBe(0);
    });

    it('toggle', async () => {
      group.toggle();
      expect(await readFirst(group.state$)).toBe(1);

      group.toggle();
      expect(await readFirst(group.state$)).toBe(0);
    });
  });

  describe('fx', () => {
    beforeEach(() => (group = conn.muteGroup('fx')));

    it('state$', async () => {
      group.mute();
      expect(await readFirst(group.state$)).toBe(1);

      group.unmute();
      expect(await readFirst(group.state$)).toBe(0);
    });

    it('toggle', async () => {
      group.toggle();
      expect(await readFirst(group.state$)).toBe(1);

      group.toggle();
      expect(await readFirst(group.state$)).toBe(0);
    });
  });
});
