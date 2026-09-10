// 螺旋矩阵 II
// https://leetcode.cn/problems/spiral-matrix-ii/
//
// 思路：维护上下左右四条边界，每轮填一圈，填完收缩边界，直到 1..n^2 全部填完。
// 复杂度：时间 O(n^2) 空间 O(1) 额外空间
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) return 0;

    vector<vector<int>> res(n, vector<int>(n, 0));
    int l = 0, r = n - 1, u = 0, d = n - 1;
    int num = 1, target = n * n;

    while (num <= target) {
        for (int i = l; i <= r && num <= target; ++i) res[u][i] = num++;
        ++u;
        for (int i = u; i <= d && num <= target; ++i) res[i][r] = num++;
        --r;
        for (int i = r; i >= l && num <= target; --i) res[d][i] = num++;
        --d;
        for (int i = d; i >= u && num <= target; --i) res[i][l] = num++;
        ++l;
    }

    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (j > 0) cout << ' ';
            cout << res[i][j];
        }
        cout << '\n';
    }
    return 0;
}
