<script lang="ts">
import { createEventDispatcher, getContext, onMount } from 'svelte';
import type { AppAgentClient, Record, EntryHash, AgentPubKey, DnaHash, ActionHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';
import { clientContext } from '../../contexts';
import type { HealthRecord } from './types';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import type { Snackbar } from '@material/mwc-snackbar';

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

const dispatch = createEventDispatcher();

export let originalHealthRecordHash!: ActionHash;

export let currentRecord!: Record;
let currentHealthRecord: HealthRecord = decode((currentRecord.entry as any).Present.entry) as HealthRecord;


let errorSnackbar: Snackbar;

$: ;
$: isHealthRecordValid = true;

onMount(() => {
  if (currentRecord === undefined) {
    throw new Error(`The currentRecord input is required for the EditHealthRecord element`);
  }
  if (originalHealthRecordHash === undefined) {
    throw new Error(`The originalHealthRecordHash input is required for the EditHealthRecord element`);
  }
});

async function updateHealthRecord() {

  const healthRecord: HealthRecord = {
    first_name: currentHealthRecord.first_name,
    family_name: currentHealthRecord.family_name,
    age: currentHealthRecord.age,
    height: currentHealthRecord.height,
    weight: currentHealthRecord.weight,
    blood_type: currentHealthRecord.blood_type,
    blood_pressure: currentHealthRecord.blood_pressure,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: 'zome_functions',
      zome_name: 'tdd_zome',
      fn_name: 'update_health_record',
      payload: {
        original_health_record_hash: originalHealthRecordHash,
        previous_health_record_hash: currentRecord.signed_action.hashed.hash,
        updated_health_record: healthRecord
      }
    });

    dispatch('health-record-updated', { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    errorSnackbar.labelText = `Error updating the health record: ${e.data.data}`;
    errorSnackbar.show();
  }
}

</script>
<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>
<div style="display: flex; flex-direction: column">
  <span style="font-size: 18px">Edit HealthRecord</span>


  <div style="display: flex; flex-direction: row">
    <mwc-button
      outlined
      label="Cancel"
      on:click={() => dispatch('edit-canceled')}
      style="flex: 1; margin-right: 16px"
    ></mwc-button>
    <mwc-button
      raised
      label="Save"
      disabled={!isHealthRecordValid}
      on:click={() => updateHealthRecord()}
      style="flex: 1;"
    ></mwc-button>
  </div>
</div>
