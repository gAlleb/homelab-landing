<script setup lang="ts">
import { localLinks } from '~/composables/useLinks'
</script>

<template>
  <ServiceGrid :links="localLinks" storage-key="local" />
</template>
