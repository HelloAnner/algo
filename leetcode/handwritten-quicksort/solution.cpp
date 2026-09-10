// 手写快速排序
// https://leetcode.cn/problems/sort-an-array/
//
// 思路：分治 + Hoare 头尾双指针划分，随机选基准避免有序数据退化；相等元素也停下来交换以保持划分均衡。
// 复杂度：期望时间 O(n log n) 空间 O(log n)（递归栈）
#include <chrono>
#include <iostream>
#include <random>
#include <utility>
#include <vector>

using namespace std;

mt19937 rng(static_cast<unsigned>(chrono::steady_clock::now().time_since_epoch().count()));

// 头尾双指针划分：返回分界点 j，保证 [low, j] 与 [j+1, high] 各自有序化后整体有序
int partitionRange(vector<int> &arr, int low, int high) {
    int pivot = arr[low + static_cast<int>(rng() % static_cast<unsigned>(high - low + 1))];
    int i = low - 1;
    int j = high + 1;
    while (true) {
        do { ++i; } while (arr[i] < pivot);
        do { --j; } while (arr[j] > pivot);
        if (i >= j) return j;
        swap(arr[i], arr[j]);
    }
}

void quickSort(vector<int> &arr, int low, int high) {
    if (low >= high) return;
    int mid = partitionRange(arr, low, high);
    quickSort(arr, low, mid);
    quickSort(arr, mid + 1, high);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int &x : arr) cin >> x;

    quickSort(arr, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i > 0) cout << ' ';
        cout << arr[i];
    }
    cout << '\n';
    return 0;
}
