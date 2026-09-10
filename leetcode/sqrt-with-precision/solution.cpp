// 求平方根（带精度）
// 面试经典题（非 LeetCode 原题）：给定 x 和精度 e，求 sqrt(x)
//
// 思路：在 [0, max(1, x)] 上二分 100 轮，mid*mid 与 x 比较收缩区间，最后按 e 的小数位数输出。
// 复杂度：时间 O(log(max(1,x)/精度))（实际常数 100 轮） 空间 O(1)
#include <iomanip>
#include <iostream>
#include <string>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    double x = 0.0;
    string eps;
    if (!(cin >> x >> eps)) return 0;

    // e = 10^-k，小数位数就是要求保留的位数
    int k = 0;
    size_t dot = eps.find('.');
    if (dot != string::npos) k = static_cast<int>(eps.size() - dot - 1);

    double low = 0.0;
    double high = x > 1.0 ? x : 1.0;
    for (int iter = 0; iter < 100; ++iter) {
        double mid = (low + high) / 2.0;
        if (mid * mid < x) {
            low = mid;
        } else {
            high = mid;
        }
    }

    cout << fixed << setprecision(k) << low << '\n';
    return 0;
}
