<template>
  <div class="form-group" :class="{ 'has-error': form.errors[field] }" :id="computedId">
    <label class="form-label" :class="{ required: required }">{{ computedLabel }}</label>
    <div v-if="inputGroupText" class="input-group">
      <slot name="input-group-before" />
      <span class="input-group-addon">{{ inputGroupText }}</span>
      <input v-model="form.values[field]" class="form-input" :type="type" :placeholder="placeholder" :name="field"
        :required="required" />
      <slot name="inputgroupafter" />
    </div>
    <div v-else>
      <input v-if="type == 'text'" v-model.trim="form.values[field]" class="form-input" type="text"
        :placeholder="placeholder" :name="field" :required="required" />
      <div v-else-if="type == 'checkboxes'" class="columns">
        <div v-for="item in options" :key="item.key" class="column col-6">
          <label class="form-checkbox">
            <input v-model="item.selected" type="checkbox" /><i class="form-icon"></i>
            {{ item.text }}
          </label>
        </div>
      </div>
      <select v-else-if="type == 'select'" v-model="form.values[field]" class="form-select">
        <option v-if="!options.length" disabled selected value="">
          {{ $t("loading...") }}
        </option>
        <option v-for="item in options" :key="item.key" :value="item.key">
          {{ item.text }}
        </option>
      </select>
    </div>
    <div v-if="hint" class="form-input-hint">
      {{ hint }}
    </div>
    <slot name="hintafter" />
    <div v-if="form.errors[field]" class="form-input-hint">
      {{ form.errors[field] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormFieldOption } from '@openupm/types';
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
  inputGroupText: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    default: 'text',
    validator: (value: string) => {
      return ['text', 'checkboxes', 'select'].includes(value);
    },
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

const options = computed(() => props.form.options[props.field] as FormFieldOption[]);
</script>