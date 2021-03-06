// TODO: Remove / move to NullableNumericalType
export type Value = number | string | Quat | undefined

// TODO: Conslidate me
export interface StateEntity {
  networkId: number;
  x: number;
  y: number;
  z: number;
  qX: number;
  qY: number;
  qZ: number;
  qW: number;
  snapShotTime: number;
}

export interface StateClientEntity {
  networkId: number;
  x: number;
  y: number;
  z: number;
  qX: number;
  qY: number;
  qZ: number;
  qW: number;
}

export type ID = string
export type Time = number
export type StateEntityGroup = StateEntity[]
export type StateEntityClientGroup = StateClientEntity[]

export interface Snapshot {
  id: ID;
  time: Time;
  state: StateEntityGroup; //| { [key: string]: StateEntityGroup };
}

export interface InterpolatedSnapshot {
  state: StateEntityGroup;
  percentage: number;
  older: ID;
  newer: ID;
}

// TODO: Remove / move
export interface Quat { x: number; y: number; z: number; w: number }
