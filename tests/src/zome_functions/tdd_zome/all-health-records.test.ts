import { assert, test } from "vitest";

import { runScenario, dhtSync, CallableCell } from '@holochain/tryorama';
import {
  NewEntryAction,
  ActionHash,
  Record,
  Link,
  AppBundleSource,
  fakeActionHash,
  fakeAgentPubKey,
  fakeEntryHash
} from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createHealthRecord } from './common.js';

test('create a HealthRecord and get all health records', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/idsov-hApp-concept.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Bob gets all health records
    let collectionOutput: Link[] = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_all_health_records",
      payload: null
    });
    assert.equal(collectionOutput.length, 0);

    // Alice creates a HealthRecord
    const createRecord: Record = await createHealthRecord(alice.cells[0]);
    assert.ok(createRecord);
    
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
    
    // Bob gets all health records again
    collectionOutput = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_all_health_records",
      payload: null
    });
    assert.equal(collectionOutput.length, 1);
    assert.deepEqual(createRecord.signed_action.hashed.hash, collectionOutput[0].target);

    // Alice deletes the HealthRecord
    await alice.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "delete_health_record",
      payload: createRecord.signed_action.hashed.hash
    });

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets all health records again
    collectionOutput = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_all_health_records",
      payload: null
    });
    assert.equal(collectionOutput.length, 0);
  });
});

