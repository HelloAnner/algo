// 数组中前 K 大 / 前 K 小的数（文档 67 节，非 LeetCode 原题）
// （《手撕字节跳动面试时出现过的算法题》67. top k：返回一个数组中前 k 个大的或者小的数字）
//
// 思路：堆维护候选集合——前 k 大用小根堆、前 k 小用大根堆，最后按要求的顺序输出。
// 复杂度：时间 O(n log k) 空间 O(k)
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k, type;
    cin >> n >> k >> type;  // type = 0 取前 k 大，type = 1 取前 k 小

    vector<int> ans;
    if (type == 0) {
        priority_queue<int, vector<int>, greater<int>> heap;  // 小根堆做淘汰线
        for (int i = 0; i < n; ++i) {
            int x;
            cin >> x;
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
        }
        // 小根堆弹出是升序，从后往前填得到降序
        ans.assign(heap.size(), 0);
        for (int i = (int)ans.size() - 1; i >= 0; --i) {
            ans[i] = heap.top();
            heap.pop();
        }
    } else {
        priority_queue<int> heap;  // 大根堆做淘汰线
        for (int i = 0; i < n; ++i) {
            int x;
            cin >> x;
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
        }
        // 大根堆弹出是降序，从后往前填得到升序
        ans.assign(heap.size(), 0);
        for (int i = (int)ans.size() - 1; i >= 0; --i) {
            ans[i] = heap.top();
            heap.pop();
        }
    }

    for (int i = 0; i < (int)ans.size(); ++i) {
        if (i) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
