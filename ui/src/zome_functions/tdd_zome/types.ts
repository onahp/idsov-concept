import type { 
  Record, 
  ActionHash,
  DnaHash,
  SignedActionHashed,
  EntryHash, 
  AgentPubKey,
  Create,
  Update,
  Delete,
  CreateLink,
  DeleteLink
} from '@holochain/client';

export type TddZomeSignal = {
  type: 'EntryCreated';
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: 'EntryUpdated';
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: 'EntryDeleted';
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: 'LinkCreated';
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: 'LinkDeleted';
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

export type EntryTypes =
 | ({  type: 'HealthRecord'; } & HealthRecord);



export interface HealthRecord { 
  first_name: string;

  family_name: string;

  age: number;

  height: number;

  weight: number;

  blood_type: string;

  blood_pressure: number;
}

