// 公交车超载
// 字节跳动面试手写题（《手撕字节跳动面试时出现过的算法题》第 80 题）
//
// 思路：边读边把每站的净变化累加到当前人数上，任何一站之后超过核载人数就超载。
// 复杂度：时间 O(m) 空间 O(1)
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m;
    long long n;
    if (!(cin >> m >> n)) return 0;

    long long load = 0;  // 当前车上人数
    for (int i = 0; i < m; ++i) {
        long long delta;
        cin >> delta;
        load += delta;
        if (load > n) {
            cout << "true" << '\n';
            return 0;
        }
    }

    cout << "false" << '\n';
    return 0;
}
