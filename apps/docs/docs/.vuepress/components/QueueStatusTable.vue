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
  margin-top: 1.5rem;
  border-top: 1px solid #d9e2ec;
  padding-top: 1rem;

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    line-height: 1.2;
  }
}

.queue-status-table__wrap {
  overflow-x: auto;
  border: 1px solid #d9e2ec;
}

.queue-status-table table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.queue-status-table th,
.queue-status-table td {
  border-bottom: 1px solid #e4e7eb;
  padding: 0.55rem 0.65rem;
  text-align: left;
  vertical-align: top;
}

.queue-status-table th {
  background: #f0f4f8;
  color: #52606d;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.queue-status-table tr:last-child td {
  border-bottom: 0;
}

.queue-status-table a {
  overflow-wrap: anywhere;
  font-weight: 600;
}

.queue-status-table__empty {
  color: #627d98;
}
</style>
