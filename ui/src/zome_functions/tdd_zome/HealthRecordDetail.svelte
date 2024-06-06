<script lang="ts">
import { createEventDispatcher, onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';
import type { Record, ActionHash, AppAgentClient, EntryHash, AgentPubKey, DnaHash } from '@holochain/client';
import { clientContext } from '../../contexts';
import type { HealthRecord } from './types';
import '@material/mwc-circular-progress';
import type { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-snackbar';
import '@material/mwc-icon-button';
import EditHealthRecord from './EditHealthRecord.svelte'; 

const dispatch = createEventDispatcher();

export let healthRecordHash: ActionHash;

let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let loading: boolean;
let error: any = undefined;

let record: Record | undefined;
let healthRecord: HealthRecord | undefined;

let editing = false;

let errorSnackbar: Snackbar;
  
$: editing,  error, loading, record, healthRecord;

onMount(async () => {
  if (healthRecordHash === undefined) {
    throw new Error(`The healthRecordHash input is required for the HealthRecordDetail element`);
  }
  await fetchHealthRecord();
});

async function fetchHealthRecord() {
  loading = true;
  
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: 'zome_functions',
      zome_name: 'tdd_zome',
      fn_name: 'get_latest_health_record',
      payload: healthRecordHash,
    });
    if (record) {
      healthRecord = decode((record.entry as any).Present.entry) as HealthRecord;
    }
  } catch (e) {
    error = e;
  }

  loading = false;
}

async function deleteHealthRecord() {
  try {
    await client.callZome({
      cap_secret: null,
      role_name: 'zome_functions',
      zome_name: 'tdd_zome',
      fn_name: 'delete_health_record',
      payload: healthRecordHash,
    });
    dispatch('health-record-deleted', { healthRecordHash: healthRecordHash });
  } catch (e: any) {
    errorSnackbar.labelText = `Error deleting the health record: ${e.data.data}`;
    errorSnackbar.show();
  }
}
</script>

<mwc-snackbar bind:this={errorSnackbar} leading>
</mwc-snackbar>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the health record: {error.data.data}</span>
{:else if editing}
<EditHealthRecord
  originalHealthRecordHash={ healthRecordHash}
  currentRecord={record}
  on:health-record-updated={async () => {
    editing = false;
    await fetchHealthRecord()
  } }
  on:edit-canceled={() => { editing = false; } }
></EditHealthRecord>
{:else}

<div style="display: flex; flex-direction: column">
  <div style="display: flex; flex-direction: row">
    <span style="flex: 1"></span>
    <mwc-icon-button style="margin-left: 8px" icon="edit" on:click={() => { editing = true; } }></mwc-icon-button>
    <mwc-icon-button style="margin-left: 8px" icon="delete" on:click={() => deleteHealthRecord()}></mwc-icon-button>
  </div>

</div>
{/if}

