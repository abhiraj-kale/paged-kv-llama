#pragma once

#include <vector>
#include "paged_cache_c_api.h"  // defines PAGE_SIZE - shared with run.c

struct Page {
    std::vector<float> data;
};

class PagePool {
public:
    PagePool(int num_pages, int n_layers, int kv_dim);

    int allocate_page();  // returns -1 if the pool is exhausted
    void free_page(int page_id);

    float* key_data(int page_id);
    float* value_data(int page_id);

    // usage introspection - for real measured benchmarking, not just configured capacity
    int total_pages() const;
    int pages_in_use() const;
    int peak_pages_used() const;

private:
    int n_layers_;
    int kv_dim_;
    std::vector<Page> key_pages_;
    std::vector<Page> value_pages_;
    std::vector<int> free_list_;
    int peak_in_use_ = 0;
};

class PageTable {
public:
    PageTable(PagePool* pool, int kv_dim);

    // return nullptr if the shared pool is exhausted - caller MUST check
    float* key_ptr(int layer, int pos);
    float* value_ptr(int layer, int pos);
    void release();

private:
    PagePool* pool_;
    int kv_dim_;
    std::vector<int> physical_page_ids_;

    bool ensure_block(int logical_block);  // false if allocation failed
};