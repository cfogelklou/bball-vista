import { describe, it, expect } from 'vitest';
import { createDeterministicUuid, GameUtils } from './gameUtils';

describe('createDeterministicUuid', () => {
  it('should generate a deterministic UUID for the same input', () => {
    const input = 'test_game_id';
    const uuid1 = createDeterministicUuid(input);
    const uuid2 = createDeterministicUuid(input);
    expect(uuid1).toBe(uuid2);
  });

  it('should generate different UUIDs for different inputs', () => {
    const input1 = 'test_game_id_1';
    const input2 = 'test_game_id_2';
    const uuid1 = createDeterministicUuid(input1);
    const uuid2 = createDeterministicUuid(input2);
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate a valid UUID format', () => {
    const input = 'some_random_input';
    const uuid = createDeterministicUuid(input);
    // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate a different UUID when useDoubleHash is false', () => {
    const input = 'test_input';
    const uuidDoubleHash = createDeterministicUuid(input, true);
    const uuidSingleHash = createDeterministicUuid(input, false);
    expect(uuidDoubleHash).not.toBe(uuidSingleHash);
  });
});

describe('GameUtils', () => {
  it('generateGameId should return a 6-character alphanumeric string', () => {
    const gameId = GameUtils.generateGameId();
    expect(gameId).toHaveLength(6);
    expect(gameId).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generateGameId should return different IDs on successive calls (high probability)', () => {
    const gameId1 = GameUtils.generateGameId();
    const gameId2 = GameUtils.generateGameId();
    expect(gameId1).not.toBe(gameId2);
  });

  it('gameIdToUuid should convert a game ID to a deterministic UUID', () => {
    const gameId = 'ABC123';
    const uuid1 = GameUtils.gameIdToUuid(gameId);
    const uuid2 = GameUtils.gameIdToUuid(gameId);
    expect(uuid1).toBe(uuid2);
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('gameIdToUuid should convert different game IDs to different UUIDs', () => {
    const gameId1 = 'ABC123';
    const gameId2 = 'DEF456';
    const uuid1 = GameUtils.gameIdToUuid(gameId1);
    const uuid2 = GameUtils.gameIdToUuid(gameId2);
    expect(uuid1).not.toBe(uuid2);
  });
});