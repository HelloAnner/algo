// 找范围（高考成绩分桶排名）
// https://www.nowcoder.com/discuss/425581
//
// 思路：分数只有 0~750，按分数分桶计数，再从高到低求后缀和得到每个分数的排名。
// 复杂度：时间 O(n + 751 + q) 空间 O(751)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long n, q;
    if (!(cin >> n >> q)) return 0;

    const int MAXS = 750;
    vector<long long> cnt(MAXS + 1, 0);
    for (long long i = 0; i < n; ++i) {
        int s;
        cin >> s;
        if (s < 0) s = 0;
        if (s > MAXS) s = MAXS;
        ++cnt[s];
    }

    // rankOf[s] = 严格高于 s 的人数 + 1（从高到低求后缀和）
    vector<long long> rankOf(MAXS + 1, 1);
    long long higher = 0;
    for (int s = MAXS; s >= 0; --s) {
        rankOf[s] = higher + 1;
        higher += cnt[s];
    }

    for (long long k = 0; k < q; ++k) {
        int s;
        cin >> s;
        cout << rankOf[s] << ' ' << cnt[s] << '\n';
    }
    return 0;
}
