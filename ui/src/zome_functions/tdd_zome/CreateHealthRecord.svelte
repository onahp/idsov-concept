<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, ActionHash, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { HealthRecord } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let firstName!: string;

export let familyName!: string;

export let age!: number;

export let height!: number;

export let weight!: number;

export let bloodType!: string;

export let bloodPressure!: number;



let errorSnackbar: Snackbar;

$: firstName, familyName, age, height, weight, bloodType, bloodPressure;
$: isHealthRecordValid = true;

onMount(() => {
  if (firstName === undefined) {
    throw new Error(`The firstName input is required for the CreateHealthRecord element`);
  }
  if (familyName === undefined) {
    throw new Error(`The familyName input is required for the CreateHealthRecord element`);
  }
  if (age === undefined) {
    throw new Error(`The age input is required for the CreateHealthRecord element`);
  }
  if (height === undefined) {
    throw new Error(`The height input is required for the CreateHealthRecord element`);
  }
  if (weight === undefined) {
    throw new Error(`The weight input is required for the CreateHealthRecord element`);
  }
  if (bloodType === undefined) {
    throw new Error(`The bloodType input is required for the CreateHealthRecord element`);
  }
  if (bloodPressure === undefined) {
    throw new Error(`The bloodPressure input is required for the CreateHealthRecord element`);
  }
});

async function createHealthRecord() {  
  const healthRecordEntry: HealthRecord = { 
    first_name: firstName!,
    family_name: familyName!,
    age: age!,
    height: height!,
    weight: weight!,
    blood_type: bloodType!,
    blood_pressure: bloodPressure!,
  };
  
  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: 'zome_functions',
      zome_name: 'tdd_zome',
      fn_name: 'create_health_record',
      payload: healthRecordEntry,
    });
    dispatch('health-record-created', { healthRecordHash: record.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error creating the health record: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Create HealthRecord</span>
  


  <mwc-button 
    raised
    label="Create HealthRecord"
    disabled={!isHealthRecordValid}
    on:click={() => createHealthRecord()}
  ></mwc-button>
</div>
