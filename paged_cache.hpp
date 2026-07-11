#pragma once

#include <vector>
#include "paged_cache_c_api.h"  // defines PAGE_SIZE — shared with run.c

struct Page {
    std::vector<float> data;
};

class PagePool {
public:
    PagePool(int num_pages, int n_layers, int kv_dim);

    int allocate_page();
    void free_page(int page_id);

    float* key_data(int page_id);
    float* value_data(int page_id);

private:
    int n_layers_;
    int kv_dim_;
    std::vector<Page> key_pages_;
    std::vector<Page> value_pages_;
    std::vector<int> free_list_;
};

class PageTable {
public:
    PageTable(PagePool* pool, int kv_dim);

    float* key_ptr(int layer, int pos);
    float* value_ptr(int layer, int pos);
    void release();

private:
    PagePool* pool_;
    int kv_dim_;
    std::vector<int> physical_page_ids_;

    void ensure_block(int logical_block);
};