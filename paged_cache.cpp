//
// Created by Abhiraj Kale on 7/10/2026.
//

#include "paged_cache.hpp"
#include "paged_cache_c_api.h"

PagePool::PagePool(int num_pages, int n_layers, int kv_dim)
    : n_layers_(n_layers), kv_dim_(kv_dim) {
    key_pages_.resize(num_pages);
    value_pages_.resize(num_pages);
    for (int i = 0; i < num_pages; i++) {
        key_pages_[i].data.resize(n_layers * PAGE_SIZE * kv_dim);
        value_pages_[i].data.resize(n_layers * PAGE_SIZE * kv_dim);
        free_list_.push_back(i);
    }
}

int PagePool::allocate_page() {
    if (free_list_.empty()) {
        return -1;  // pool exhausted — no pages left to give out
    }
    int page_id = free_list_.back();
    free_list_.pop_back();
    int in_use = (int)key_pages_.size() - (int)free_list_.size();
    if (in_use > peak_in_use_) peak_in_use_ = in_use;
    return page_id;
}

void PagePool::free_page(int page_id) {
    free_list_.push_back(page_id);
}

float* PagePool::key_data(int page_id) {
    return key_pages_[page_id].data.data();
}

float* PagePool::value_data(int page_id) {
    return value_pages_[page_id].data.data();
}

int PagePool::total_pages() const {
    return (int)key_pages_.size();
}

int PagePool::pages_in_use() const {
    return (int)key_pages_.size() - (int)free_list_.size();
}

int PagePool::peak_pages_used() const {
    return peak_in_use_;
}

PageTable::PageTable(PagePool* pool, int kv_dim)
    : pool_(pool), kv_dim_(kv_dim) {}

bool PageTable::ensure_block(int logical_block) {
    while ((int)physical_page_ids_.size() <= logical_block) {
        int page_id = pool_->allocate_page();
        if (page_id == -1) {
            return false;  // pool exhausted — do not record a bogus page id
        }
        physical_page_ids_.push_back(page_id);
    }
    return true;
}

float* PageTable::key_ptr(int layer, int pos) {
    int logical_block = pos / PAGE_SIZE;
    int offset_in_block = pos % PAGE_SIZE;
    if (!ensure_block(logical_block)) {
        return nullptr;
    }
    int page_id = physical_page_ids_[logical_block];
    float* page_base = pool_->key_data(page_id);
    return page_base + layer * PAGE_SIZE * kv_dim_ + offset_in_block * kv_dim_;
}

float* PageTable::value_ptr(int layer, int pos) {
    int logical_block = pos / PAGE_SIZE;
    int offset_in_block = pos % PAGE_SIZE;
    if (!ensure_block(logical_block)) {
        return nullptr;
    }
    int page_id = physical_page_ids_[logical_block];
    float* page_base = pool_->value_data(page_id);
    return page_base + layer * PAGE_SIZE * kv_dim_ + offset_in_block * kv_dim_;
}

void PageTable::release() {
    for (int page_id : physical_page_ids_) {
        pool_->free_page(page_id);
    }
    physical_page_ids_.clear();
}
extern "C" {

PagePoolHandle* pagepool_create(int num_pages, int n_layers, int kv_dim) {
    return reinterpret_cast<PagePoolHandle*>(new PagePool(num_pages, n_layers, kv_dim));
}

void pagepool_destroy(PagePoolHandle* pool) {
    delete reinterpret_cast<PagePool*>(pool);
}

int pagepool_total_pages(PagePoolHandle* pool) {
    return reinterpret_cast<PagePool*>(pool)->total_pages();
}

int pagepool_pages_in_use(PagePoolHandle* pool) {
    return reinterpret_cast<PagePool*>(pool)->pages_in_use();
}

int pagepool_peak_pages_used(PagePoolHandle* pool) {
    return reinterpret_cast<PagePool*>(pool)->peak_pages_used();
}

PageTableHandle* pagetable_create(PagePoolHandle* pool, int kv_dim) {
    return reinterpret_cast<PageTableHandle*>(new PageTable(reinterpret_cast<PagePool*>(pool), kv_dim));
}

void pagetable_destroy(PageTableHandle* table) {
    delete reinterpret_cast<PageTable*>(table);
}

float* pagetable_key_ptr(PageTableHandle* table, int layer, int pos) {
    return reinterpret_cast<PageTable*>(table)->key_ptr(layer, pos);
}

float* pagetable_value_ptr(PageTableHandle* table, int layer, int pos) {
    return reinterpret_cast<PageTable*>(table)->value_ptr(layer, pos);
}

void pagetable_release(PageTableHandle* table) {
    reinterpret_cast<PageTable*>(table)->release();
}

}