#ifndef PAGED_CACHE_C_API_H
#define PAGED_CACHE_C_API_H

// single source of truth for the page size — shared by both the C (run.c)
// and C++ (paged_cache.hpp/.cpp) sides, since a plain #define is valid in both
#define PAGE_SIZE 16

#ifdef __cplusplus
extern "C" {
#endif

typedef struct PagePoolHandle PagePoolHandle;
typedef struct PageTableHandle PageTableHandle;

PagePoolHandle* pagepool_create(int num_pages, int n_layers, int kv_dim);
void pagepool_destroy(PagePoolHandle* pool);

PageTableHandle* pagetable_create(PagePoolHandle* pool, int kv_dim);
void pagetable_destroy(PageTableHandle* table);
float* pagetable_key_ptr(PageTableHandle* table, int layer, int pos);
float* pagetable_value_ptr(PageTableHandle* table, int layer, int pos);
void pagetable_release(PageTableHandle* table);

#ifdef __cplusplus
}
#endif

#endif