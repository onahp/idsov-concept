<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import type { ActionHash, AppAgentClient } from '@holochain/client';
  import { AppAgentWebsocket } from '@holochain/client';
  import '@material/mwc-circular-progress';

  import { clientContext } from './contexts';

  let client: AppAgentClient | undefined;

  let loading = true; 


  onMount(async () => {
    // We pass an unused string as the url because it will dynamically be replaced in launcher environments
    client = await AppAgentWebsocket.connect(new URL('https://UNUSED'), 'idsov-hApp-concept');

    loading = false;
  });

  setContext(clientContext, {
    getClient: () => client,
  });
</script>

<main>
  {#if loading}
    <div style="display: flex; flex: 1; align-items: center; justify-content: center">
      <mwc-circular-progress indeterminate />
    </div>
  {:else}
    <div id="content" style="display: flex; flex-direction: column; flex: 1;">
      <h2>EDIT ME! Add the components of your app here.</h2>

      <span>Look in the <code>ui/src/DNA/ZOME</code> folders for UI elements that are generated with <code>hc scaffold entry-type</code>, <code>hc scaffold collection</code> and <code>hc scaffold link-type</code> and add them here as appropriate.</span>
        
      <span>For example, if you have scaffolded a "todos" dna, a "todos" zome, a "todo_item" entry type, and a collection called "all_todos", you might want to add an element here to create and list your todo items, with the generated <code>ui/src/todos/todos/AllTodos.svelte</code> and <code>ui/src/todos/todos/CreateTodo.svelte</code> elements.</span>
          
      <span>So, to use those elements here:</span>
      <ol>
        <li>Import the elements with:
        <pre>
import AllTodos from './todos/todos/AllTodos.svelte';
import CreateTodo from './todos/todos/CreateTodo.svelte';
        </pre>
        </li>
        <li>Replace this "EDIT ME!" section with <code>&lt;CreateTodo&gt;&lt;/CreateTodo&gt;&lt;AllTodos&gt;&lt;/AllTodos&gt;</code>.</li>
        </ol>
    </div>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
