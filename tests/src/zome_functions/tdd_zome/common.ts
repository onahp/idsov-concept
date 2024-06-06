import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';

export async function sampleHealthRecord(cell: CallableCell, partialHealthRecord = {}) {
    return {
        ...{
	  first_name: "Jackson",
	  family_name: "Donald",
	  age: 20,
	  height: 180,
	  weight: 90,
	  blood_type: "O+",
	  blood_pressure: 60,
        },
        ...partialHealthRecord
    };
}

export async function createHealthRecord(cell: CallableCell, healthRecord = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "tdd_zome",
      fn_name: "create_health_record",
      payload: healthRecord || await sampleHealthRecord(cell),
    });
}
