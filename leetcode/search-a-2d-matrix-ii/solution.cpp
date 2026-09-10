// 搜索二维矩阵 II
// https://leetcode.cn/problems/search-a-2d-matrix-ii/
//
// 思路：从右上角出发，比 target 小就下移一行、比 target 大就左移一列，
//       每一步排除一整行或一整列，最多走 m + n 步。
// 复杂度：时间 O(m + n) 空间 O(1)（不含输入矩阵本身）
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m = 0, n = 0;
    if (!(cin >> m >> n)) return 0;

    vector<vector<long long>> a(m, vector<long long>(n));
    for (int i = 0; i < m; ++i) {
        for (int j = 0; j < n; ++j) cin >> a[i][j];
    }

    long long target = 0;
    cin >> target;

    int i = 0, j = n - 1;
    bool found = false;
    while (i < m && j >= 0) {
        if (a[i][j] == target) {
            found = true;
            break;
        } else if (a[i][j] < target) {
            ++i;
        } else {
            --j;
        }
    }

    cout << boolalpha << found << '\n';
    return 0;
}
