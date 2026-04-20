<script setup lang="ts">
import { publicLinks } from '~/composables/useLinks'
</script>

<template>
  <ServiceGrid :links="publicLinks" storage-key="public" />
</template>
