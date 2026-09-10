// 合并排序的数组（面试题 10.01）
// https://leetcode.cn/problems/sorted-merge-lcci/
//
// 思路：双指针从后往前原地归并，每次把两个剩余序列的较大者写到 A 的末尾。
// 复杂度：时间 O(m+n) 空间 O(1)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m, n;
    if (!(cin >> m >> n)) return 0;

    vector<int> A(m + n, 0), B(n);
    for (int i = 0; i < m; ++i) cin >> A[i];
    for (int j = 0; j < n; ++j) cin >> B[j];

    int i = m - 1, j = n - 1, k = m + n - 1;
    while (i >= 0 && j >= 0) {
        if (A[i] > B[j]) {
            A[k--] = A[i--];
        } else {
            A[k--] = B[j--];
        }
    }
    while (i >= 0) A[k--] = A[i--];
    while (j >= 0) A[k--] = B[j--];

    for (int t = 0; t < m + n; ++t) {
        if (t) cout << ' ';
        cout << A[t];
    }
    cout << '\n';
    return 0;
}
