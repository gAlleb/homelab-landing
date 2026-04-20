<script setup lang="ts">
import { externalLinks } from '~/composables/useLinks'
</script>

<template>
  <ServiceGrid :links="externalLinks" storage-key="external" />
</template>
