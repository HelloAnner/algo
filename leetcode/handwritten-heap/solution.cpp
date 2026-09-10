// 手写堆（大根堆 / 小根堆）
// 题目：讲一讲 heap 是什么，并手写一个堆（《手撕字节跳动面试时出现过的算法题》第 32 题）
//
// 思路：数组存完全二叉树，push 末尾上浮、pop 用末尾元素补堆顶后下沉，比较方向由 higher() 统一。
// 复杂度：push/pop 时间 O(log n)，peek/size O(1)，空间 O(n)
#include <iostream>
#include <string>
#include <utility>
#include <vector>

using namespace std;

class BinaryHeap {
public:
    explicit BinaryHeap(bool minHeap) : minHeap_(minHeap) {}

    void push(long long x) {
        data_.push_back(x);
        shiftUp(static_cast<int>(data_.size()) - 1);
    }

    long long top() const { return data_.front(); }

    long long pop() {
        long long res = data_.front();
        data_.front() = data_.back();
        data_.pop_back();
        if (!data_.empty()) shiftDown(0);
        return res;
    }

    size_t size() const { return data_.size(); }
    bool empty() const { return data_.empty(); }

private:
    // a 是否比 b 更优先（小根堆：更小优先；大根堆：更大优先）
    bool higher(long long a, long long b) const {
        return minHeap_ ? a < b : a > b;
    }

    // 上浮：新元素放在末尾，与父节点比较，更优先就交换
    void shiftUp(int k) {
        while (k > 0) {
            int parent = (k - 1) / 2;
            if (!higher(data_[k], data_[parent])) break;
            swap(data_[k], data_[parent]);
            k = parent;
        }
    }

    // 下沉：在左右孩子里挑更优先的那个，比它差就交换
    void shiftDown(int k) {
        int n = static_cast<int>(data_.size());
        while (true) {
            int best = k;
            int left = 2 * k + 1;
            int right = 2 * k + 2;
            if (left < n && higher(data_[left], data_[best])) best = left;
            if (right < n && higher(data_[right], data_[best])) best = right;
            if (best == k) break;
            swap(data_[k], data_[best]);
            k = best;
        }
    }

    vector<long long> data_;
    bool minHeap_;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int q, type;
    if (!(cin >> q >> type)) return 0;

    BinaryHeap heap(type == 0);
    string op;
    while (q-- > 0) {
        cin >> op;
        if (op == "push") {
            long long x;
            cin >> x;
            heap.push(x);
        } else if (op == "pop") {
            if (heap.empty()) {
                cout << "empty" << '\n';
            } else {
                cout << heap.pop() << '\n';
            }
        } else if (op == "peek") {
            if (heap.empty()) {
                cout << "empty" << '\n';
            } else {
                cout << heap.top() << '\n';
            }
        } else if (op == "size") {
            cout << heap.size() << '\n';
        }
    }
    return 0;
}
