<script lang="ts">
import { onMount, getContext } from 'svelte';
import '@material/mwc-circular-progress';
import type { EntryHash, Record, AgentPubKey, ActionHash, AppAgentClient, NewEntryAction } from '@holochain/client';
import { clientContext } from '../../contexts';
import HealthRecordDetail from './HealthRecordDetail.svelte';
import type { TddZomeSignal } from './types';


let client: AppAgentClient = (getContext(clientContext) as any).getClient();

let hashes: Array<ActionHash> | undefined;
let loading = true;
let error: any = undefined;

$: hashes, loading, error;

onMount(async () => {

  await fetchHealthRecords();
  client.on('signal', signal => {
    if (signal.zome_name !== 'tdd_zome') return;
    const payload = signal.payload as TddZomeSignal;
    if (payload.type !== 'EntryCreated') return;
    if (payload.app_entry.type !== 'HealthRecord') return;
    hashes = [...hashes, payload.action.hashed.hash];
  });
});

async function fetchHealthRecords() {
  try {
    const links = await client.callZome({
      cap_secret: null,
      role_name: 'zome_functions',
      zome_name: 'tdd_zome',
      fn_name: 'get_all_health_records',
      payload: null,
    });
    hashes = links.map(l => l.target);
  } catch (e) {
    error = e;
  }
  loading = false;
}

</script>

{#if loading}
<div style="display: flex; flex: 1; align-items: center; justify-content: center">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
{:else if error}
<span>Error fetching the health records: {error.data.data}.</span>
{:else if hashes.length === 0}
<span>No health records found.</span>
{:else}
<div style="display: flex; flex-direction: column">
  {#each hashes as hash}
    <div style="margin-bottom: 8px;">
      <HealthRecordDetail healthRecordHash={hash}  on:health-record-deleted={() => fetchHealthRecords()}></HealthRecordDetail>
    </div>
  {/each}
</div>
{/if}

