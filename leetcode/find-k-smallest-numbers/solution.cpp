// 找 K 个最小值
// 面试经典题（非 LeetCode 原题；同类：LeetCode 面试题 17.14 最小 K 个数）
//
// 思路：用大小为 k 的大顶堆在线维护候选集合，堆顶是当前第 k 小，比它大的数直接丢弃。
// 复杂度：时间 O(n log k) 空间 O(k)
#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, k = 0;
    if (!(cin >> n >> k)) return 0;

    priority_queue<int> heap;  // 大顶堆：堆顶是候选集合中最大的数
    for (int i = 0; i < n; ++i) {
        int x = 0;
        cin >> x;
        if (static_cast<int>(heap.size()) < k) {
            heap.push(x);
        } else if (x < heap.top()) {
            heap.pop();
            heap.push(x);
        }
    }

    vector<int> ans;
    ans.reserve(heap.size());
    while (!heap.empty()) {
        ans.push_back(heap.top());
        heap.pop();
    }
    reverse(ans.begin(), ans.end());  // 大顶堆弹出是从大到小，逆序变升序

    for (size_t i = 0; i < ans.size(); ++i) {
        if (i > 0) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
