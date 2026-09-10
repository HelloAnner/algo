// 买卖股票的最佳时机
// https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/
//
// 思路：一次遍历，维护历史最低价 minPrice 和当前最大利润 best。
// 复杂度：时间 O(n) 空间 O(1)
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 1) {
        // 少于两天不可能完成一次交易
        cout << 0 << '\n';
        return 0;
    }

    vector<int> prices(n);
    for (auto &p : prices) cin >> p;

    int minPrice = prices[0];
    int best = 0;
    for (int i = 1; i < n; ++i) {
        best = max(best, prices[i] - minPrice);
        minPrice = min(minPrice, prices[i]);
    }

    cout << best << '\n';
    return 0;
}
