// 加油站（LeetCode 134. Gas Station）
// https://leetcode.cn/problems/gas-station/
//
// 思路：一次遍历。total 记录总盈余，小于 0 一定无解；curr 记录从当前候选起点
//       出发的剩余油量，一旦 curr < 0，说明 start..i 都不能作为起点，改为 i + 1。
// 复杂度：时间 O(n) 空间 O(1)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> gas(n), cost(n);
    for (auto &g : gas) cin >> g;
    for (auto &c : cost) cin >> c;

    long long total = 0;  // 总盈余
    long long curr = 0;   // 从 start 出发到当前位置的剩余油量
    int start = 0;
    for (int i = 0; i < n; ++i) {
        long long diff = gas[i] - cost[i];
        total += diff;
        curr += diff;
        if (curr < 0) {
            // 从 start 到 i 之间的站都到不了 i + 1，下一个候选起点是 i + 1
            start = i + 1;
            curr = 0;
        }
    }

    cout << (total >= 0 ? start : -1) << '\n';
    return 0;
}
