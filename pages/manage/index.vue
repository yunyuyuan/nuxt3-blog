<script setup lang="ts">
definePageMeta({
  middleware () {
    return navigateTo(useLocalePath()("/manage/config"));
  }
});
</script>
