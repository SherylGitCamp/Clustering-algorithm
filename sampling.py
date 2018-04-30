from collections import Counter
from sklearn.datasets import make_classification
from imblearn.combine import SMOTETomek
#from imblearn.under_sampling import ClusterCentroids
from imblearn.under_sampling import RandomUnderSampler
import pandas as pd
import numpy as np
import json

'''
X, y = make_classification(n_classes=4, class_sep=2,
weights=[0.1, 0.8, 0.05, 0.05], n_informative=2, n_redundant=0, flip_y=0,
n_features=4, n_clusters_per_class=1, n_samples=1000, random_state=10) 

print(y.shape)


'''

df1 = pd.read_json('/home/v/Desktop/gmmJSON_10class_0427/part-00000-15ce7325-52e3-47a6-a5a3-48f69f264a12-c000.json',  lines=True)
df2 = pd.read_json('/home/v/Desktop/gmmJSON_10class_0427/part-00001-15ce7325-52e3-47a6-a5a3-48f69f264a12-c000.json',  lines=True)
df3 = pd.read_json('/home/v/Desktop/gmmJSON_10class_0427/part-00002-15ce7325-52e3-47a6-a5a3-48f69f264a12-c000.json',  lines=True)

df = pd.concat([df1, df2, df3])

X = df.as_matrix(columns=['googRtt', 'PL', 'Nacks', 'Plis'])
y = df.as_matrix(columns=['label']).reshape(-1,)


print('Original dataset shape {}'.format(Counter(y)))


OverSamp = SMOTETomek(random_state=42, ratio={0:8000, 1:7600, 2:9500, 4:7800, 6:10500, 7:7700, 8:9000})
X_res, y_res = OverSamp.fit_sample(X, y)
print('Resampled dataset shape {}'.format(Counter(y_res)))

UnderSamp = RandomUnderSampler(random_state=513, ratio={3:11000, 5:10500, 9:10000})
X_, y_ = UnderSamp.fit_sample(X_res, y_res)
print('Resampled dataset shape {}'.format(Counter(y_)))

data = np.concatenate((X_, y_.reshape(-1,1)),axis = 1)
columns_name = np.array (['googRtt', 'PL', 'Nacks', 'Plis','label'])
df_new = pd.DataFrame(data = data, columns = columns_name)
df_new.to_json('/home/v/Desktop/gmmJSON_10class_0430/reshaped_data_0430.json', orient = 'records', lines = True)

'''
UnderSamp = ClusterCentroids(random_state=513, ratio={3:13000, 5:14000, 9:10000})
X_, y_ = UnderSamp.fit_sample(X_res, y_res)
print('Resampled dataset shape {}'.format(Counter(y_)))

'''
