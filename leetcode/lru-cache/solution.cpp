// LRU 缓存
// https://leetcode.cn/problems/lru-cache/
//
// 思路：哈希表（key -> 链表节点）+ 双向链表维护使用顺序，表头是最近使用、表尾是最久未使用。
// 复杂度：时间 O(1)/次操作（平均） 空间 O(capacity)
#include <iostream>
#include <list>
#include <string>
#include <unordered_map>
#include <utility>

using namespace std;

class LRUCache {
  public:
    explicit LRUCache(int capacity) : cap_(capacity) {}

    int get(int key) {
        auto it = pos_.find(key);
        if (it == pos_.end()) return -1;
        // 命中：把节点搬到链表头部（变成最近使用）
        data_.splice(data_.begin(), data_, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = pos_.find(key);
        if (it != pos_.end()) {
            // key 已存在：改值 + 刷新为最近使用，不新增条目
            it->second->second = value;
            data_.splice(data_.begin(), data_, it->second);
            return;
        }
        if (static_cast<int>(data_.size()) == cap_) {
            // 先取尾节点的 key，再删节点，最后清哈希表
            int oldKey = data_.back().first;
            data_.pop_back();
            pos_.erase(oldKey);
        }
        data_.emplace_front(key, value);
        pos_[key] = data_.begin();
    }

  private:
    int cap_;
    list<pair<int, int>> data_;                                // front = 最近使用
    unordered_map<int, list<pair<int, int>>::iterator> pos_;   // key -> 对应节点
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int capacity;
    if (!(cin >> capacity)) return 0;
    LRUCache cache(capacity);

    string op;
    while (cin >> op) {
        if (op == "put") {
            int k = 0, v = 0;
            cin >> k >> v;
            cache.put(k, v);
        } else if (op == "get") {
            int k = 0;
            cin >> k;
            cout << cache.get(k) << '\n';
        }
    }
    return 0;
}
