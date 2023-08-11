<script setup lang="ts">
definePageMeta({
  middleware () {
    return navigateTo("/manage/config");
  }
});
</script>
