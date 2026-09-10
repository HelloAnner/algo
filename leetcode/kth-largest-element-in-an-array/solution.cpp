// 数组中的第 K 个最大元素（LeetCode 215）
// https://leetcode.cn/problems/kth-largest-element-in-an-array/
//
// 思路：小根堆维护最大的 k 个数，堆顶即第 k 大。
// 复杂度：时间 O(n log k) 空间 O(k)
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;

    // 小根堆：堆顶是这 k 个数里最小的，也就是「前 k 大」的守门员
    priority_queue<int, vector<int>, greater<int>> heap;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        heap.push(x);
        if ((int)heap.size() > k) heap.pop();  // 超过 k 个就把最小的淘汰掉
    }

    cout << heap.top() << '\n';
    return 0;
}
