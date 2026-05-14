<template>
  <section class="queue-status-table">
    <h2>{{ title }}</h2>
    <div class="queue-status-table__wrap">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody v-if="!empty">
          <slot />
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="columns.length" class="queue-status-table__empty">
              No rows
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  columns: string[];
  empty: boolean;
}>();
</script>

<style lang="scss">
.queue-status-table {
  margin-top: 0.9rem;

  h2 {
    margin: 0 0 0.4rem;
    font-size: 0.8rem;
    line-height: 1.2;
  }
}

.queue-status-table__wrap {
  overflow-x: auto;
}

.queue-status-table table {
  width: 100%;
  min-width: 640px;
  margin: 0;
  border-collapse: collapse;
  font-size: 0.7rem;
}

.queue-status-table th,
.queue-status-table td {
  border-bottom: 1px solid var(--c-border);
  padding: 0.55rem 0.65rem;
  text-align: left;
  vertical-align: top;
}

.queue-status-table th {
  background: var(--c-bg-light);
  color: var(--c-text-light);
  font-size: 0.7rem;
  text-transform: uppercase;
}

.queue-status-table a {
  overflow-wrap: anywhere;
  font-weight: 600;
}

.queue-status-table__empty {
  color: var(--c-text-lighter);
}

.dark {
  .queue-status-table th {
    background: var(--c-bg-dark);
    color: var(--c-text-lighter);
  }

  .queue-status-table tbody tr:nth-child(even) td {
    background: rgba(255, 255, 255, 0.02);
  }
}
</style>
