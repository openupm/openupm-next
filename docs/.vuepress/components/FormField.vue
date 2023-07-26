<template>
  <div class="form-group" :class="{ 'has-error': form.errors[field] }" :id="computedId">
    <label class="form-label" :class="{ required: required }">{{ computedLabel }}</label>
    <input v-model="form.values[field]" class="form-input" :type="type" :placeholder="placeholder" :name="field"
      :required="required" />
    <div v-if="hint" class="form-input-hint">
      {{ hint }}
    </div>
    <div v-if="form.errors[field]" class="form-input-hint">
      {{ form.errors[field] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { capitalize } from 'lodash-es';
import { ref, computed } from 'vue';

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
});

const required = computed(() => props.form.required[props.field]);

const computedId = computed(() => 'id_' + props.field);

const computedLabel = computed(() => props.label || capitalize(props.field));
</script>