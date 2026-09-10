// 归并排序
// https://leetcode.cn/problems/sort-an-array/
//
// 思路：分治，递归排好左右两半后，用双指针把两个有序段合并到临时数组再写回。
// 复杂度：时间 O(n log n) 空间 O(n)
#include <iostream>
#include <vector>

using namespace std;

vector<long long> tmp;  // 复用的临时数组

void mergeSort(vector<long long> &a, int l, int r) {
    if (l >= r) return;  // 长度 0 或 1，天然有序

    int mid = l + (r - l) / 2;
    mergeSort(a, l, mid);
    mergeSort(a, mid + 1, r);

    int i = l, j = mid + 1, k = l;
    while (i <= mid && j <= r) {
        // 相等时取左边，保证排序稳定
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];

    for (int t = l; t <= r; ++t) a[t] = tmp[t];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> a(n);
    for (auto &x : a) cin >> x;

    tmp.assign(n, 0);
    if (n > 0) mergeSort(a, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    return 0;
}
